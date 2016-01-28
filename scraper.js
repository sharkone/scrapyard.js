var bittorrentTracker = require('bittorrent-tracker');
var parseTorrent      = require('parse-torrent');

// ----------------------------------------------------------------------------

exports.scrape = function(magnetLink, callback) {
  var parsedMagnedLink = parseTorrent(magnetLink);
  var client           = new bittorrentTracker(new Buffer('01234567890123456789'), 6881, parsedMagnedLink);

  client.on('error', function(err) {
    console.log('scraper error', err);
    client.destroy();
    callback(err, null, null);
  });

  client.on('scrape', function(data) {
    client.destroy();
    callback(null, data.complete, data.incomplete);
  });

  client.scrape();
}
