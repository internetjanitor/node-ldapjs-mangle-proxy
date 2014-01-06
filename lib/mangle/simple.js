function Simple(cb) {
  this.cb = cb;
}

Simple.prototype.result = function (res, next) {
  this.cb(res, next);
}

module.exports = Simple;
