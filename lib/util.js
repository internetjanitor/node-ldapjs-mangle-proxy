var asn1 = require('asn1');
var assert = require('assert');
var ldapjs = require('ldapjs');

function isObjectClass(type, entry) {
  var objectClass = entry['objectClass'];
  if (objectClass && Array.isArray(objectClass)) {
    return (objectClass.indexOf(type) > -1);
  }
  return (objectClass == type);
}

function isAttrRequested(attr, req) {
  var lower = attr.toLowerCase();
  return (req.attributes.length == 0 || req.attributes.indexOf(lower) !== -1);
}

function ensureAttrRequested(attr, req) {
  if (!isAttrRequested(attr, req)) {
    req.attributes.push(attr.toLowerCase());
  }
}

function forEachFilter(input, cb) {
  var result = cb(input);
  if (result != null) {
    if (Array.isArray(result.filters)) {
      // Handle multi-child filters (such as AND/OR)
      result.filters = result.filters.map(function (item) {
        return forEachFilter(item, cb);
      }).filter(function (item) {
        return (item != null);
      });
      if (result.filters.length == 0) {
        result = null;
      }
    } else if (result.filter) {
      // Handle single-child filters (such as NOT)
      result.filter = forEachFilter(result.filter, cb);
      if (result.filter == null) {
        result = null;
      }
    }
  }
  return result;
}


/* Get around the limitations of EqualityFilter */

function BinaryEqualityFilter(options) {
  if (typeof (options) === 'object') {
    if (!options.attribute || typeof (options.attribute) !== 'string')
      throw new TypeError('options.attribute (string) required');
    if (!options.value || !(options.value instanceof Buffer))
      throw new TypeError('options.value (Buffer) required');
    this.attribute = options.attribute;
    this.value = options.value;
  } else {
    options = {};
  }
  options.type = ldapjs.FILTER_EQUALITY;
  ldapjs.Filter.call(this, options);

  var self = this;
  this.__defineGetter__('json', function () {
    return {
      type: 'EqualityMatch',
      attribute: self.attribute || undefined,
      value: self.value || undefined
    };
  });
}

BinaryEqualityFilter.prototype = new ldapjs.EqualityFilter()

BinaryEqualityFilter.prototype._toBer = function (ber) {
  assert.ok(ber);

  ber.writeString(this.attribute);
  if (this.value instanceof Buffer) {
    ber.writeBuffer(this.value, asn1.Ber.OctetString);
  } else {
    ber.writeString(this.value);
  }

  return ber;
};


module.exports = {
  isObjectClass: isObjectClass,
  isAttrRequested: isAttrRequested,
  ensureAttrRequested: ensureAttrRequested,
  forEachFilter: forEachFilter,
  BinaryEqualityFilter: BinaryEqualityFilter
};
