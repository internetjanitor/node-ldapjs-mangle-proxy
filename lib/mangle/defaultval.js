var ObjectClass = require('./objectclass');
var util = require('../util');

function DefaultVal(matchClass, values) {
  return new ObjectClass(matchClass, function (res) {
    for (key in values) {
      if (util.isAttrRequested(key, res.request)) {
        res.output[key] = res.output[key] || values[key];
      }
    }
    res.next();
  });
}

module.exports = DefaultVal;
