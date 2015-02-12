'use strict';
/**
Based on: https://github.com/carlos8f/node-hashcashgen
License: MIT
Copyright (C) 2012 Carlos Rodriguez (http://s8f.org/)
Copyright (C) 2012 Terra Eclipse, Inc. (http://www.terraeclipse.com/)
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF  CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var sha512 = require('./sha512');

function repeat(input, length) {
  length = length || 0;
  var ret = '';
  for (var i = 0; i < length; i++) {
    ret += input;
  }
  return ret;
}

function now() {
  return new Date().getTime();
}

exports.generate = function generateHashCash(challenge, strength) {
  var search = repeat('0', strength);
  var counter = 0;
  var attempt = challenge + (counter++);
  while (!exports.check(challenge, strength, attempt, search)) {
    attempt = challenge + (counter++);
  }
  return attempt;
};

// this method is only used in the browser when
// it fails to load as a web-worker
exports.generateFakeAsync = function generateHashCash(challenge, strength, callback) {
  var search = repeat('0', strength);
  var counter = 0;
  var attempt = challenge + (counter++);
  function run() {
    var start = now();
    try {
      while (!exports.check(challenge, strength, attempt, search)) {
        attempt = challenge + (counter++);
        if ((now() - start) > 15) {
          return setTimeout(run, 0);
        }
      }
    } catch (ex) {
      return callback(ex);
    }
    return callback(null, attempt);
  }
  run();
};

exports.check = function checkHashCash(challenge, strength, workToken, search) {
  search = search || repeat('0', strength);
  return (
    challenge &&
    strength &&
    workToken &&
    workToken.indexOf(challenge) === 0 &&
    sha512(workToken).indexOf(search) === 0
  );
};
