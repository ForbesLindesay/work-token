'use strict';

var assert = require('assert');
var IS_BROWSER = require('is-browser');
var result = require('test-result');
require('promise/polyfill');

// crypto.randomBytes(20).toString('base64')
var challenge = 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=';

var async = require('../async');

var tests = [];
function equal(a, b) {
  assert(typeof a.then === 'function');
  tests.push(Promise.all([a, b]).then(function (results) {
    assert(results[0] === results[1]);
  }));
}

equal(async.generate(challenge, 4), 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=67012');
equal(async.check(challenge, 5, 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=678755'),
       true);
equal(async.check(challenge, 5, 'a5vxMzl9ke5ZWmQKbKbmj0BQP/E=678755'),
       false);
equal(async.check(challenge, 5, 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=678754'),
       false);
equal(async.check(challenge, 6, 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=678755'),
       false);

if (!IS_BROWSER) {
  async = async.pool(2);
  equal(async.generate(challenge, 4), 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=67012');
  equal(async.check(challenge, 5, 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=678755'),
         true);
  equal(async.check(challenge, 5, 'a5vxMzl9ke5ZWmQKbKbmj0BQP/E=678755'),
         false);
  equal(async.check(challenge, 5, 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=678754'),
         false);
  equal(async.check(challenge, 6, 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=678755'),
         false);
  async.dispose();
}

Promise.all(tests).done(function () {
  result.pass('async');
}, function (err) {
  if (typeof console !== 'undefined' && typeof console.log == 'function') {
    console.log(err.stack);
  }
  result.fail('async');
});
