'use strict';

var cp = require('child_process');

function Pool(count) {
  this._workers = [];
  this._idle = [];
  this._queue = [];
  this._disposed = false;
  for (var i = 0; i < count; i++) {
    var worker = cp.fork(__dirname + '/lib/worker.js');
    this._workers.push(worker);
    this._idle.push(worker);
  }
}
Pool.prototype.generate = poolMethod('generate');
Pool.prototype.check = poolMethod('check');
Pool.prototype.dispose = function () {
  this._disposed = true;
  while (this._idle.length) {
    var worker = this._idle.pop();
    var index = this._workers.indexOf(worker);
    if (index !== -1) {
      this._workers.splice(index, 1);
      worker.disconnect();
    }
  }
};

exports.pool = function (count) {
  return new Pool(count);
};
exports.generate = method('generate');
exports.check = method('check');

function poolMethod(name) {
  return function recurse() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    var self = this;
    var workers = this._workers;
    var idle = this._idle;
    var queue = this._queue;
    if (this._idle.length) {
      var worker = this._idle.pop();
      return apply(worker, function () {
        if (workers.indexOf(worker) !== -1) {
          if (self._disposed && queue.length === 0) {
            var index = workers.indexOf(worker);
            if (index !== -1) {
              workers.splice(index, 1);
              worker.disconnect();
            }
          } else {
            idle.push(worker);
            if (queue.length) queue.pop()();
          }
        }
      }, name, args);
    } else {
      this._queue.push(function () {
        recurse.apply(self, args);
      });
      if (typeof args[args.length - 1] !== 'function') {
        return new Promise(function (resolve, reject) {
          args.push(function (err, res) {
            if (err) reject(err);
            else resolve(res);
          });
        });
      }
    }
  }
}
function method(name) {
  return function () {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    var worker = cp.fork(__dirname + '/lib/worker.js');
    return apply(worker, function () {
      worker.disconnect();
    }, name, args);
  }
}
function apply(worker, dispose, method, args) {
  var result, callback;
  if (typeof args[args.length - 1] === 'function') {
    callback = args.pop();
  } else {
    result = new Promise(function (resolve, reject) {
      callback = function (err, res) {
        if (err) reject(err);
        else resolve(res);
      };
    });
  }
  worker.once('message', function (data) {
    dispose();
    var error = typeof data.error === 'string' ?
        new Error(data.error) :
        data.error;
    callback(error, data.result);
  });
  worker.send({
    method: method,
    args: args
  });
  return result;
}
