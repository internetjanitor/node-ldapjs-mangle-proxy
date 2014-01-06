var parseDN = require('ldapjs').parseDN;

function cloneRequest(req) {
  var out = {
    dn: parseDN(req.dn.toString()),
    scope: req.scope.toString(),
    attributes: req.attributes.slice(0),
    suffix: parseDN(req.suffix.toString()),
  };
  // TODO: make safe clone of filter
  out.filter = req.filter;
  return out;
}

function Request(req) {
  var self = this;
  var wrClone = cloneRequest(req);
  for (property in wrClone) {
    this[property] = wrClone[property];
  }
  this._original = cloneRequest(req);
}

Request.prototype.next = function () {
  // This property should be set by request handlers
  throw new Error('Request next callback not overriden');
};

Object.defineProperty(Request.prototype, 'original', {
  configurable : false,
  enumerable : false,
  get : function () {
    // TODO: setup properly protected getters
    return this._original;
  },
});


module.exports = Request;
