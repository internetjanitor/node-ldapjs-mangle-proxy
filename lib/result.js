var parseDN = require('ldapjs').parseDN;

function cloneFields(obj) {
  var result = {}
  for (key in obj) {
    if (Array.isArray(obj[key])) {
      result[key] = obj[key].slice(0);
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

function Result(entry, request) {
  this.dn = parseDN(entry.dn.toString());
  this.object = cloneFields(entry.object);
  this.raw = entry.raw;
  this.request = request;
}

Result.prototype.next = function (halt) {
  // This property should be set by request handlers
  throw new Error('Result next callback not overriden');
};

module.exports = Result;
