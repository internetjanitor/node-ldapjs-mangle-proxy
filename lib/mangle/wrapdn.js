var ldapjs = require('ldapjs');
var parseDN = ldapjs.parseDN;

function WrapDN(fields) {
  this.fields = Array.isArray(fields) ? fields : [fields];
}

WrapDN.prototype.result = function (res, next, req, raw) {
  this.fields.forEach(function (item) {
    if (res[item]) {
      if (Array.isArray(res[item])) {
        var result = [];
        res[item].forEach(function (subitem) {
          result.push(parseDN(subitem));
        });
        res[item] = result;
      } else {
        res[item] = parseDN(res[item]);
      }
    }
  });
  next(res);
}

module.exports = WrapDN;
