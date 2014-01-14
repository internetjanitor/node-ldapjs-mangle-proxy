function Simple(cb) {
  this.cb = cb;
}

Simple.prototype.result = function (res) {
  this.cb(res.output);
  res.next();
}

module.exports = Simple;
