'use strict';
1423750416072
1423750619817

var ms = require('ms');
var chalk = require('chalk');
var run = require('sauce-test');
var Promise = require('promise');

var queue = [];

var async = true, sync = true;
if (process.argv.indexOf('async') !== -1 ||
    process.argv.indexOf('sync') !== -1) {
  async = false;
  sync = false;
}
if (process.argv.indexOf('async') !== -1) {
  async = true;
}
if (process.argv.indexOf('sync') !== -1) {
  sync = true;
}

if (sync) {
  queue.push(internalRun(
    'sync',
    require.resolve('./sync.js'),
    filterSync,
    'work-token',
    'bf9eb74a-c9fa-4860-ad64-8d1d90628540'
  ));
}
if (async) {
  queue.push(internalRun(
    'async',
    require.resolve('./async.js'),
    filterAsync,
    'work-token-async',
    'c7c7be9e-178b-4735-907b-f3afc6ae1f58'
  ));
}

Promise.all(queue).done(function (passed) {
  if (!passed.every(Boolean)) process.exit(1);
}, function (err) {
  throw err;
});

function filterSync(browser, version) {
  switch (browser) {
    case 'firefox':
      return version > 3.6;
    case 'opera':
      return version > 11;
    case 'internet explorer':
      return version > 8;
    default:
      return true;
  }
}
function filterAsync(browser, version) {
  return filterSync(browser, version);
  switch (browser) {
    case 'firefox':
      return version > 8;
    default:
      return filterSync(browser, version);
  }
}


function internalRun(name, filename, filter, user, accessKey) {
  var IS_ASYNC = name === 'async';
  name = IS_ASYNC ? chalk.magenta(name) : chalk.blue(name);
  var ENTRIES = [filename];

  var USER = user;
  var ACCESS_KEY = accessKey;
  var LOCAL = !process.env.CI && process.argv[2] !== 'sauce';


  var CAPABILITIES = {
    'record-video': false,
    'record-screenshots': true,
    'capture-html': false
  };
  function filterPlatforms(platform) {
    var browser = platform.browserName;
    var version = platform.version;
    if (version === 'dev' || version === 'beta') return false;
    if (!filter(browser, +version)) {
      return false;
    }
    if (browser === 'chrome') {
      return (+version) >= 35 || (+version) < 5 || (+version) % 5 === 0;
    }
    if (browser === 'firefox') {
      // firefox 3.6 does not work
      return (+version) >= 30 || (+version) < 5 || (+version) % 5 === 0;
    }
    return true;
  }
  function choosePlatforms(platforms) {
    return [platforms[Math.floor(Math.random() * platforms.length)]];
  }

  if (LOCAL) {
    return run(ENTRIES, 'chromedriver', {
      browserify: true,
      disableSSL: true
    }).then(function (res) {
      if (res.passed) {
        console.log(name + chalk.green(' browser tests passed (' + ms(res.duration) + ')'));
        return true;
      } else {
        console.log(name + chalk.red(' browser tests failed (' + ms(res.duration) + ')'));
        return false;
      }
    }, function (err) {
      if (err.duration) {
        console.log(name + chalk.red(' browser tests failed (' + ms(err.duration) + ')'));
      } else {
        console.log(name + chalk.red(' browser tests failed'));
      }
      throw err;
    });
  } else {
    var failedBrowsers = [];
    return run(ENTRIES, 'saucelabs', {
      browserify: true,
      username: USER,
      accessKey: ACCESS_KEY,
      parallel: 4,
      disableSSL: true,
      capabilities: CAPABILITIES,
      filterPlatforms: filterPlatforms,
      choosePlatforms: choosePlatforms,
      bail: true,
      // the async tests can run for a very long time
      // if they are forced to fall back to the fake
      // async method of computation
      timeout: IS_ASYNC ? '10m' : '5m',
      onResult: function (res) {
        if (res.passed) {
          console.log(name + ' ' +
                      res.browserName + ' ' +
                      res.version + ' ' +
                      res.platform +
                      ' passed ' +
                      chalk.cyan('(' + ms(res.duration) + ')'));
        } else {
          failedBrowsers.push(res);
          console.log(name + ' ' +
                      chalk.red(res.browserName + ' ' +
                                res.version + ' ' +
                                res.platform +
                                ' failed ') +
                      chalk.cyan('(' + ms(res.duration) + ')'));
          if (res.err) {
            console.error(res.err.stack || res.err.message || res.err);
          }
        }
      },
      onBrowserResults: function (browser, results) {
        if (results.every(function (result) { return result.passed; })) {
          console.log(name + ' ' +
                      chalk.green(browser + ' all passsed'));
        } else {
          console.log(name + ' ' +
                      chalk.red(browser + ' some failures'));
        }
      }
    }).then(function (results) {
      if (failedBrowsers.length) {
        console.log(name + ' ' +
                    chalk.red('failed browsers'));
        failedBrowsers.forEach(function (res) {
          console.log(chalk.red(res.browserName + ' ' +
                                res.version + ' ' +
                                res.platform +
                                ' (' + ms(res.duration) + ')'));
        });
        console.log(name + ' ' +
                    chalk.red('browser tests Failed'));
        return false;
      } else {
        console.log(name + ' ' +
                    chalk.green('browser tests Passed'));
        return true;
      }
    });
  }
}
