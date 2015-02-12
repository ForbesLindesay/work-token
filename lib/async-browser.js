'use strict';

var fs = require('fs');

var workerSrc = fs.readFileSync(__dirname + '/../bin/worker-browser.js', 'utf8');
var worker;

try {
  var blob;
  try {
    blob = new Blob([workerSrc], {type: 'application/javascript'});
  } catch (e) { // Backwards-compatibility
    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
    blob = new window.BlobBuilder();
    blob.append(workerSrc);
    blob = blob.getBlob();
  }

  worker = new Worker(window.URL.createObjectURL(blob));
} catch (ex) {
  try {
    worker = new Worker('data:application/javascript,' +
                        encodeURIComponent(workerSrc));
  } catch (ex) {
    var reqHandlers = [];
    var resHandlers = [];
    var self = {
      addEventListener: function (name, handler) {
        if (name === 'message') {
          reqHandlers.push(handler);
        }
      },
      postMessage: function (data) {
        for (var i = 0; i < resHandlers.length; i++) {
          resHandlers[i]({data: data});
        }
      }
    };
    var worker = {
      fakeWorker: true,
      addEventListener: function (name, handler) {
        if (name === 'message') {
          resHandlers.push(handler);
        }
      },
      postMessage: function (data) {
        for (var i = 0; i < resHandlers.length; i++) {
          reqHandlers[i]({data: data});
        }
      }
    };
    Function('self', workerSrc)(self);
  }
}

var id = 0;
var callbacks = {};
worker.addEventListener('message', function (e) {
  if (callbacks[e.data.id]) {
    var error = typeof e.data.error === 'string' ?
        new Error(e.data.error) :
        e.data.error;
    callbacks[e.data.id](error, e.data.result);
    delete callbacks[e.data.id];
  }
});


exports.pool = function (count) {
  return {
    generate: exports.generate,
    check: exports.check,
    dispose: function () {}
  };
};

exports.generate = function (challenge, strength, callback) {
  var result;
  if (!callback) {
    result = new Promise(function (resolve, reject) {
      callback = function (err, res) {
        if (err) reject(err);
        else resolve(res);
      };
    });
  }
  if (worker.fakeWorker) {
    worker.postMessage({
      id: id++,
      method: 'generateFakeAsync',
      args: [challenge, strength, callback]
    });
    return result;
  }
  callbacks[id] = callback;
  worker.postMessage({
    id: id,
    method: 'generate',
    args: [challenge, strength]
  });
  id++;
  return result;
};

exports.check = function (challenge, strength, workToken, callback) {
  var result;
  if (callback) {
    callbacks[id] = callback;
  } else {
    result = new Promise(function (resolve, reject) {
      callbacks[id] = function (err, res) {
        if (err) reject(err);
        else resolve(res);
      };
    });
  }
  worker.postMessage({
    id: id,
    method: 'check',
    args: [challenge, strength, workToken]
  });
  id++;
  return result;
};
