var assert = require('assert');

function Chain() {
  this.chains = {
    request: [],
    result: []
  };
}

Chain.prototype._push = function (type, obj) {
  if (this.chains[type]) {
    this.chains[type].push(obj);
  } else {
    this.chains[type] = [obj];
  }
};

Chain.prototype.chain = function (type, obj) {
  if (typeof (type) === 'string') {
    this._push(type, obj);
    return this;
  }
  // No type passed, chain to all
  return this._chainAll(type);
};

Chain.prototype._chainAll = function (obj) {
  var self = this;
  Object.keys(this.chains).forEach(function (chain) {
    self._push(chain, obj)
  });
  return this;
};

Chain.prototype.process = function (type, state) {
  this._dispatchProcess(type, state, state.next, 0);
};

Chain.prototype._dispatchProcess = function (type, state, cb, index) {
  var chain = this.chains[type];
  var self = this;
  assert.ok(Array.isArray(chain));

  if (index >= chain.length) {
    cb.call(state);
  } else {
    filter = chain[index];
    if (typeof(filter[type]) == 'function') {
      state.next = function (halt) {
        if (halt === true) {
          cb.call(this, halt);
        } else {
          /* call the next processor in the chain */
          self._dispatchProcess(type, state, cb, index+1);
        }
      };
      filter[type].call(filter, state);
    } else {
      /* skip over filters that lack request processors */
      this._dispatchProcess(type, state, cb, index+1);
    }
  }
};

Chain.prototype.request = function (req) {
  this.process('request', req);
};

Chain.prototype.result = function (res) {
  this.process('result', res);
};

module.exports = Chain;
