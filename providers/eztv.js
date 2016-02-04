var async        = require('async');
var parseTorrent = require('parse-torrent');

var network = require('../network');

// ----------------------------------------------------------------------------

EZTV_URL = 'https://www.popcorntime.ws/api/eztv'

// ----------------------------------------------------------------------------

exports.episode = function(showInfo, seasonIndex, episodeIndex, callback) {
  network.json(EZTV_URL + '/show/' + showInfo.imdb_id, null, null, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      var magnets = [];

      if ('episodes' in data) {
        for (var i = 0; i < data.episodes.length; i++) {
          if (data.episodes[i].season == seasonIndex && data.episodes[i].episode == episodeIndex) {
            for (var key in data.episodes[i].torrents) {
              var magnetLink       = data.episodes[i].torrents[key].url;
              var parsedMagnetLink = parseTorrent(magnetLink);

              if (!magnets.find(function(element, index, array) { return parseTorrent(element.link).infoHash == parsedMagnetLink.infoHash; })) {
                magnets.push({
                  title: '[EZTV] ' + parsedMagnetLink.dn,
                  link:  magnetLink,
                  size:  0,
                  seeds: 0,
                  peers: 0
                });
              }
            }

            callback(null, magnets);
            return;
          }
        }
      }
    }
  });
}
