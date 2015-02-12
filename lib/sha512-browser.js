'use strict';

var Sha512 = require('sha.js/sha512');

module.exports = sha512;
function sha512(input) {
  return new Sha512()
    .update(input, 'utf8')
    .digest('hex');
}
