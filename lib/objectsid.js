var binary = require('binary');

function ObjectSid(version, type, domsid) {
  this.version = version || 1;
  this.type = type || new Buffer(6);
  this.domsid = domsid || [];
}

ObjectSid.prototype.toString = function () {
  /* return S-1-... formatted string */
  var output = ['S', this.version, this.outputType()].concat(this.domsid);
  return output.join('-');
};

ObjectSid.prototype.fromString = function (input) {
  var self = this;
  input.split('-').some(function (item, index) {
    switch (index) {
    case 0:
      /* output must be propery formatted: S-1-... */
      if (item != 'S') {
        return true;
      }
      break;
    case 1:
      self.version = item;
      break;
    case 2:
      self.inputType(item);
      /* initialize new domsid array in preparation */
      self.domsid = new Array();
      break;
    default:
      self.domsid.push(item)
      break;
    }
  });
  return this;
};

ObjectSid.prototype.inputType = function (type) {
  this.type = new Buffer(6);
  var value = type;
  for (var i = 0; i < 6; i++) {
    var octet = value & 0xff;
    value = value >> 8;
    this.type.writeUInt8(octet, 5-i);
  }
};

ObjectSid.prototype.outputType = function () {
  var buf = new Buffer(6);
  this.type.copy(buf, 0);
  var output = 0;

  for (var i = 0; i < 6; i++) {
    output = output << 8;
    output = output | buf[i];
  }
  return output;
};

ObjectSid.prototype.toBinary = function () {
  var len = this.domsid.length + 2;
  var buf = new Buffer(len*4);
  buf.writeUInt8(this.version, 0);
  buf.writeUInt8(len-2, 1);
  this.type.copy(buf, 2, 0, 6);
  for (var i = 2; i < len; i++) {
    buf.writeUInt32LE(this.domsid[i-2], i*4);
  }
  return buf;
}

ObjectSid.prototype.fromBinary = function (buf) {
  var parser = binary.parse(buf)
    .word8lu('version')
    .word8lu('fields')
    .buffer('type', 6)
    .loop(function (end, vars) {
      vars.sid = vars.sid || new Array();
      vars.sid.push(this.word32lu('sid_field').vars.sid_field);
      if (vars.sid.length >= vars.fields) {
        end();
      }
    })
  ;
  this.version = parser.vars.version;
  this.type = parser.vars.type;
  this.domsid = parser.vars.sid;
  return this;
};

ObjectSid.prototype.domainId = function () {
  //return this.fields.slice(2,this.fields.length-1).join('-');
  return this.domsid.slice(0,this.domsid.length-1).join('-');
};

ObjectSid.prototype.relativeId = function () {
  //return this.fields[this.fields.length-1];
  return this.domsid[this.domsid.length-1];
};

module.exports = ObjectSid;
