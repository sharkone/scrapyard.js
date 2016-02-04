var async        = require('async');
var parseTorrent = require('parse-torrent');

var network = require('../network');

// ----------------------------------------------------------------------------

EZTV_URL = 'https://www.popcorntime.ws/api/eztv'

// ----------------------------------------------------------------------------

exports.episode = function(showInfo, seasonIndex, episodeIndex, callback) {
  var magnets = [];
  network.json(EZTV_URL + '/show/' + showInfo.imdb_id, null, null, function(err, data) {
    if (err) {
      callback(null, magnets);
    } else {
      if (data && 'episodes' in data) {
        for (var i = 0; i < data.episodes.length; i++) {
          if (data.episodes[i].season == seasonIndex && data.episodes[i].episode == episodeIndex) {
            for (var key in data.episodes[i].torrents) {
              var magnetLink       = data.episodes[i].torrents[key].url;
              var parsedMagnetLink = parseTorrent(magnetLink);
              parsedMagnetLink.dn  = parsedMagnetLink.name = '[EZTV] ' + parsedMagnetLink.dn;
              magnetLink           = parseTorrent.toMagnetURI(parsedMagnetLink);

              if (!magnets.find(function(element, index, array) { return parseTorrent(element.link).infoHash == parsedMagnetLink.infoHash; })) {
                magnets.push({
                  title: parsedMagnetLink.dn,
                  link:  magnetLink,
                  size:  0,
                  seeds: data.episodes[i].torrents[key].seeds,
                  peers: data.episodes[i].torrents[key].peers
                });
              }
            }
            callback(null, magnets);
            return;
          }
        }
      }
      callback(null, magnets);
    }
  });
}
