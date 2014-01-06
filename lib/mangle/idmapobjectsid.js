var ObjectSid = require('../objectsid');
var util = require('../util');


function IdMapObjectSid (domainSid, params) {
  this.domainSid = domainSid;
  this.params = {
    idMin: 200000,
    idMax: 2000200000,
    uidField: 'uidNumber',
    gidField: 'gidNumber',
  };
  /* override parameter defaults */
  for (field in params) {
    this.params[field] = params[field];
  }
}

IdMapObjectSid.prototype.request = function (req, next) {
  util.ensureAttrRequested('objectClass', req);
  util.ensureAttrRequested('objectSid', req);
  this.cleanFilter(req);
  req.next();
}

IdMapObjectSid.prototype.cleanFilter = function (req) {
  if (req.filter) {
    var type = null;
    var field = null;
    util.forEachFilter(req.filter, function (filter) {
      if (filter.type == 'equal' &&
          filter.attribute == 'objectclass') {
        type = filter.value;
      }
      return filter;
    });
    if (type == 'user') {
      field = this.params['uidField'].toLowerCase();
    } else if (type == 'group') {
      field = this.params['gidField'].toLowerCase();
    }
    var self = this;
    util.forEachFilter(req.filter, function (filter) {
      if (filter.attribute && filter.attribute == field) {
        var sid = self.idToObjectSid(filter.value);
        filter.attribute = 'objectsid';
        if (filter.type == 'equal' && sid) {
          filter = new util.BinaryEqualityFilter({
            attribute: 'objectsid',
            value: sid.toBinary(),
          });
        }
      }
      return filter;
    });
  }
}

IdMapObjectSid.prototype.idToObjectSid = function (id) {
  if (id >= this.params.idMin && id <= this.params.idMax) {
    var relid = parseInt(id, 10) - this.params.idMin;
    var sidString = ['S', '1', '5', this.domainSid, relid].join('-');
    console.log(sidString);
    console.log(this);
    return new ObjectSid().fromString(sidString);
  }
}

IdMapObjectSid.prototype.objectSidToId = function (sid) {
  if (this.domainSid === sid.domainId()) {
    var id = parseInt(sid.relativeId(), 10) + this.params.idMin;
    if (id <= this.params.idMax) {
      return id;
    }
  }
  return null;
}

IdMapObjectSid.prototype.result = function (res) {
  var sid = new ObjectSid().fromBinary(res.object['objectSid']);
  var id = this.objectSidToId(sid);
  if (util.isObjectClass('user', res.object) && id) {
    res.object[this.params.uidField] = id;
  } else if (util.isObjectClass('group', res.object) && id) {
    res.object[this.params.gidField] = id;
  }
  res.next();
}

module.exports = IdMapObjectSid;
