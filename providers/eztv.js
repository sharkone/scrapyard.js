var async        = require('async');
var magnet       = require('magnet-uri');
var parseTorrent = require('parse-torrent');

var network = require('../network');

// ----------------------------------------------------------------------------

EZTV_URL = 'https://api-fetch.website/tv'

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

              if (parsedMagnetLink.dn) {
                if (!magnets.find(function(element, index, array) { return parseTorrent(element.link).infoHash == parsedMagnetLink.infoHash; })) {
                  var magnetInfo = {
                    title:  parsedMagnetLink.dn,
                    source: 'EZTV',
                    link:   magnetLink,
                    size:   0,
                    seeds:  -1,
                    peers:  -1
                  };

                  magnetInfo.link = magnet.encode({
                    dn: magnetInfo.title,
                    xt: [ 'urn:btih:' + parsedMagnetLink.infoHash ],
                    tr: [
                          'udp://tracker.internetwarriors.net:1337',
                          'udp://tracker.coppersurfer.tk:6969',
                          'udp://open.demonii.com:1337',
                          'udp://tracker.leechers-paradise.org:6969',
                          'udp://tracker.openbittorrent.com:80'
                        ]
                  });

                  magnets.push(magnetInfo);
                }
              }
            }
          }
        }
      }
      callback(null, magnets);
    }
  });
}
