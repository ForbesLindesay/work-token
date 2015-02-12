'use strict';

var assert = require('assert');
var result = require('test-result');

// crypto.randomBytes(20).toString('base64')
var challenge = 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=';

var sync = require('../sync');

assert(sync.generate(challenge, 4) === 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=67012');
assert(sync.check(challenge, 4, 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=67012') ===
       true);
assert(sync.check(challenge, 4, 'a5vxMzl9ke5ZWmQKbKbmj0BQP/E=67012') ===
       false);
assert(sync.check(challenge, 4, 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=67010') ===
       false);
assert(sync.check(challenge, 5, 'f5vxMzl9ke5ZWmQKbKbmj0BQP/E=67012') ===
       false);

result.pass('sync');
