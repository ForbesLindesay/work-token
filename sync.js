'use strict';

var hashcache = require('./lib/hashcache');

exports.generate = function (challenge, strength) {
  return hashcache.generate(challenge, strength);
};
exports.check = function (challenge, strength, workToken) {
  return hashcache.check(challenge, strength, workToken);
};
