# work-token

Simple proof of work generation and verification library based on [hashcachgen](https://github.com/carlos8f/node-hashcashgen).  It works on node.js and in web browsers.  The idea is that this can be used as an alternative to throttling on a web API.  Instead of throttling, you give each client a challenge, it then performs a computationally hard problem on the challenge to produce a "work token".  This can then be sent along with a request to the API.  The server is then able to easilly verify that the work has been performed.  Someone who wishes to abuse your API by sending large numbers of requests would then need to spend large amounts of time computing the work tokens.

Proudly in use on [iamthefold](https://github.com/iest/i-am-the-fold) to prevent unscrupulous individuals from abusing the site.

[![Build Status](https://img.shields.io/travis/ForbesLindesay/work-token/master.svg)](https://travis-ci.org/ForbesLindesay/work-token)
[![Dependency Status](https://img.shields.io/david/ForbesLindesay/work-token.svg)](https://david-dm.org/ForbesLindesay/work-token)
[![NPM version](https://img.shields.io/npm/v/work-token.svg)](https://www.npmjs.org/package/work-token)

## Installation

    npm install work-token

## Usage

You can load either the synchronous or asynchronous version of this library and it can be used in the browser via browserify.  We run tests on sauce labs separately so you can see the browser support for both the synchronous and asynchronous tests.

### Sync

[![Sauce Test Status](https://saucelabs.com/browser-matrix/work-token.svg)](https://saucelabs.com/u/work-token)

```js
'use strict';

var work = require('work-token/sync');
var idgen = require('idgen')

// do this on the server
var challenge = idgen();

// do this on the client
// this will probalby take a couple of seconds
// increasing the number increases the amount of
// time required to generate the token
var workToken = work.generate(challenge, 4);

// back on the server, you can verify that work has been done
assert(work.check(challenge, 4, workToken));
```

### Async

[![Sauce Test Status](https://saucelabs.com/browser-matrix/work-token-async.svg)](https://saucelabs.com/u/work-token-async)

Async on the server will spin out a separate worker process for each token you attempt to verify or generate.  On the client, it will attempt to use web-workers if the browser supports them, and will fall back to using `setTimeout` to break the loop every 15ms and avoid blocking the main thread.

It can be used with either callbacks or promises.

With Callbacks:

```js
'use strict';

var work = require('work-token/async');
var idgen = require('idgen')

// do this on the server
var challenge = idgen();

// do this on the client
// this will probalby take a couple of seconds
// increasing the number increases the amount of
// time required to generate the token
work.generate(challenge, 4, function (err, token) {
  if (err) throw err;

  // back on the server, you can verify that work has been done
  return work.check(challenge, 4, workToken, function (err, isValid) {
    if (err) throw err;
    assert(isValid);
  });
});
```

With Promises:

```js
'use strict';

// polyfill required in older browsers and node < 0.12
require('promise/polyfill');
var work = require('work-token/async');
var idgen = require('idgen')

// do this on the server
var challenge = idgen();

// do this on the client
// this will probalby take a couple of seconds
// increasing the number increases the amount of
// time required to generate the token
work.generate(challenge, 4).then(function (token) {
  // back on the server, you can verify that work has been done
  return work.check(challenge, 4, workToken);
}).done(function (isValid) {
  assert(isValid);
});
```

To avoid spinning up and tearing down processes for each request you can instead create a pool on the server.  This is not currently implemented on the client.

```js
'use strict';

// polyfill required in older browsers and node < 0.12
require('promise/polyfill');
// create a worker pool with 5 processes
var work = require('work-token/async').pool(5);
var idgen = require('idgen')

// do this on the server
var challenge = idgen();

// do this on the client
// this will probalby take a couple of seconds
// increasing the number increases the amount of
// time required to generate the token
work.generate(challenge, 4).then(function (token) {
  // back on the server, you can verify that work has been done
  return work.check(challenge, 4, workToken);
}).done(function (isValid) {
  assert(isValid);
  // dispose the worker pool once we are done with it
  work.dispose();
});
```

## License

  MIT
