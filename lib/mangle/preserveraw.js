
function PreserveRaw(fields) {
  if (Array.isArray(fields)) {
    this.fields = fields;
  } else {
    this.fields = [fields];
  }
}

PreserveRaw.prototype.result = function (res) {
  this.fields.forEach(function (item) {
    if (item in res.raw && item in res.output) {
      res.output[item] = res.raw[item];
    }
  });
  res.next();
}

module.exports = PreserveRaw;
