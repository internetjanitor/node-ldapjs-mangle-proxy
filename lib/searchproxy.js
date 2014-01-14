var assert = require('assert');

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
  var self = this;
  request.next = function () {
    self._search(this, response, cb);
  }
  if (this.filter.request) {
    this.filter.request(request);
  } else {
    request.next();
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
      entry.request = request;
      entry.output = entry.object;
      self._result(entry, response, function () {
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

SearchProxy.prototype._result = function (result, response, cb) {
  var self = this;
  result.next = function(halt) {
    if (!halt) {
      var output = {
        dn: this.dn,
        attributes: this.output
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
