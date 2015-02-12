'use strict';

var hashcache = require('./hashcache');

self.addEventListener('message', function(e) {
  var result;
  try {
    result = hashcache[e.data.method].apply(hashcache, e.data.args);
  } catch (ex) {
    console.log(ex.stack || ex.message);
    self.postMessage({
      id: e.data.id,
      error: ex.message || ex
    });
    return;
  }
  self.postMessage({
    id: e.data.id,
    result: result
  });
}, false);
