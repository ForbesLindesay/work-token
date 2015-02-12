'use strict';

var hashcache = require('./hashcache');

process.on('message', function(data) {
  var result;
  try {
    result = hashcache[data.method].apply(hashcache, data.args);
  } catch (ex) {
    process.send({
      error: ex.message || ex
    });
    return;
  }
  process.send({
    result: result
  });
}, false);
