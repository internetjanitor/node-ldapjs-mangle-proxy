var assert = require('assert');
var Request = require('./request');
var Result = require('./result');

function SearchProxy(client, filter, log) {
  this.client = client;
  this.filter = filter;
  this.log = log;
}

SearchProxy.prototype.execute = function (request, response, cb) {
  if (this.log.debug()) {
    this.log.debug({
      basedn: request.dn.toString(),
      scope: request.scope.toString(),
      attributes: request.attributes,
      filter: request.filter.toString()
    }, 'Proxy request');
  }
  var req = new Request(request);
  var self = this;
  req.next = function () {
    self._search(req, response, cb);
  }
  if (this.filter.request) {
    this.filter.request(req);
  } else {
    req.next();
  }
};

SearchProxy.prototype._search = function (request, response, cb) {
  var opts = {
    scope: request.scope || 'base',
    filter: request.filter,
    attributes: request.attributes
  }
  var self = this;
  if (this.log.debug()) {
    this.log.debug({
      basedn: request.dn.toString(),
      scope: opts.scope.toString(),
      attributes: opts.attributes,
      filter: opts.filter.toString()
    }, 'Proxy search')
  }
  this.client.search(request.dn, opts, function (error, res) {
    assert.ifError(error);
    var finished = false;
    var pending = 0;
    res.on('searchEntry', function (entry) {
      pending += 1;
      self._result(entry, request, response, function () {
        pending -= 1;
        if (pending == 0 && finished) {
          self._endResult(response, cb);
        }
      });
    });
    res.on('end', function(result) {
      if (pending > 0) {
        finished = true
      } else {
        self._endResult(response, cb);
      }
    });
    res.on('error', function(err) {
      if (self.log.warn()) {
        self.log.warn({error: err}, 'Client search error');
      }
      cb();
    });
  });
}

SearchProxy.prototype._result = function (entry, request, response, cb) {
  var self = this;
  var result = new Result(entry, request);
  result.next = function(halt) {
    if (!halt) {
      var output = {
        dn: this.dn,
        attributes: this.object
      };
      /* don't send the DN in the attrs too */
      delete output.attributes['dn'];
      if (self.log.debug()) {
        self.log.debug(output, 'Translated result')
      }
      response.send(output);
    }
    cb();
  };

  this.filter.result(result);
};

SearchProxy.prototype._endResult = function (response, cb) {
  response.end();
  cb();
};

module.exports = SearchProxy;
