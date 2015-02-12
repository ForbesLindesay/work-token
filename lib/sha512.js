'use strict';

var createHash = require('crypto').createHash;

module.exports = sha512;
function sha512(input) {
  return createHash('sha512')
    .update(input, 'utf8')
    .digest('hex');
}
