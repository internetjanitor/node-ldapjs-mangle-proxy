var util = require('../util');

function ObjectClass(matchClass, filter) {
  this.matchClass = matchClass;
  this.filter = filter;
}

ObjectClass.prototype.request = function (req) {
  util.ensureAttrRequested('objectClass', req);
  req.next();
}

ObjectClass.prototype.result = function (res) {
  if (util.isObjectClass(this.matchClass, res.output)) {
    this.filter(res);
  } else {
    res.next();
  }
}


module.exports = ObjectClass;
