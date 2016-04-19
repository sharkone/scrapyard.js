var bittorrentTracker = require('bittorrent-tracker');
var LRU               = require('lru-cache');
var parseTorrent      = require('parse-torrent');

// ----------------------------------------------------------------------------

exports.cache = new LRU({
  max:    7500,
  maxAge: 60 * 60 * 1000,
  scrape: true
});

// ----------------------------------------------------------------------------

function scrape(magnetLink, callback) {
  var parsedMagnedLink = parseTorrent(magnetLink);
  var client           = new bittorrentTracker(new Buffer('01234567890123456789'), 6881, parsedMagnedLink);

  // client.on('error', function(err) {
  //   console.log(err);
  //   client.destroy();
  //   callback(err, null);
  // });

  // client.on('warning', function(err) {
  //   console.log(err);
  //   client.destroy();
  //   callback(err, null);
  // });

  client.on('scrape', function(data) {
    client.destroy();
    callback(null, { seeds: data.complete, peers: data.incomplete });
  });

  client.scrape();
}

// ----------------------------------------------------------------------------

exports.scrape = function(magnetLink, callback) {
  var startTime        = new Date().getTime();
  var parsedMagnedLink = parseTorrent(magnetLink);

  var key   = parsedMagnedLink.infoHash;
  var value = exports.cache.peek(key);

  // Value doesn't exist in cache, force update
  if (!value) {
    scrape(magnetLink, function(err, results) {
      if (err) {
        console.log('[BTRT][ERR][' + getDuration(startTime) + 's] ' + parsedMagnedLink.dn);
        callback(err, null);
      } else {
        console.log('[BTRT][NET][' + getDuration(startTime) + 's] ' + parsedMagnedLink.dn + ' (S:' + results.seeds + ' P:' + results.peers + ')');
        exports.cache.set(key, results);
        callback(null, results);
      }
    });
  } else {
    var getValue = exports.cache.get(key);
    if (!getValue) {
      // Value is outdated, try and update it
      scrape(magnetLink, function(err, results) {
        if (err) {
          // Failed to update, return previous value
          console.log('[BTRT][FLB][' + getDuration(startTime) + 's] ' + parsedMagnedLink.dn + ' (S:' + value.seeds + ' P:' + value.peers + ')');
          exports.cache.set(key, value);
          callback(null, value);
        } else {
          // Update cache and return new value
          console.log('[BTRT][NET][' + getDuration(startTime) + 's] ' + parsedMagnedLink.dn + ' (S:' + results.seeds + ' P:' + results.peers + ')');
          exports.cache.set(key, results);
          callback(null, results);
        }
      });
    } else {
      // Value is still in cache
      // console.log('[BTRT][MEM][' + getDuration(startTime) + 's] ' + parsedMagnedLink.dn + ' (S:' + getValue.seeds + ' P:' + getValue.peers + ')');
      callback(null, getValue);
    }
  }
}

// ----------------------------------------------------------------------------

function getDuration(startTime) {
  var duration = ((new Date().getTime() - startTime) / 1000.0).toFixed(1);
  if (duration < 10.0) {
    duration = '0' + duration;
  }
  return duration;
}
