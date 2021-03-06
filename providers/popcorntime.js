var async        = require('async');
var magnet       = require('magnet-uri');
var parseTorrent = require('parse-torrent');
var util         = require('util');

var network = require('../network');

// ----------------------------------------------------------------------------

POPCORNTIME_URL = 'https://api-fetch.website/tv'

// ----------------------------------------------------------------------------

exports.movie = function(movieInfo, callback) {
  var magnets = [];
  network.json(POPCORNTIME_URL + '/movie/' + movieInfo.imdb_id, null, null, function(err, data) {
    if (err) {
      callback(null, magnets);
    } else {
      if (data && 'torrents' in data) {
        for (var lang in data.torrents) {
          for (var key in data.torrents[lang]) {
            var magnetLink       = data.torrents[lang][key].url;
            var parsedMagnetLink = parseTorrent(magnetLink);

            if (parsedMagnetLink) {
              if (!magnets.find(function(element, index, array) { return parseTorrent(element.link).infoHash == parsedMagnetLink.infoHash; })) {
                var magnetInfo = {
                  title:  (parsedMagnetLink.dn) ? parsedMagnetLink.dn : util.format('%s (%s) - %s - %s', movieInfo.title, movieInfo.year, key, data.torrents[lang][key].provider),
                  source: data.torrents[lang][key].provider,
                  link:   magnetLink,
                  size:   data.torrents[lang][key].size,
                  seeds:  (data.torrents[lang][key].seed > 0) ? data.torrents[lang][key].seed : -1,
                  peers:  (data.torrents[lang][key].peer > 0) ? data.torrents[lang][key].peer : -1,
                };

                magnetInfo.link = magnet.encode({
                  dn: magnetInfo.title,
                  xt: [ 'urn:btih:' + parsedMagnetLink.infoHash ],
                  tr: parsedMagnetLink.tr
                });

                magnets.push(magnetInfo);
              }
            }
          }
        }
      }
      callback(null, magnets);
    }
  });
}

// ----------------------------------------------------------------------------

exports.episode = function(showInfo, seasonIndex, episodeIndex, callback) {
  var magnets = [];
  network.json(POPCORNTIME_URL + '/show/' + showInfo.imdb_id, null, null, function(err, data) {
    if (err) {
      callback(null, magnets);
    } else {
      var torrents = [];

      if (data && 'episodes' in data) {
        for (var i = 0; i < data.episodes.length; i++) {
          if (data.episodes[i].season == seasonIndex && data.episodes[i].episode == episodeIndex) {
            torrents = data.episodes[i].torrents;
            break;
          }
        }
      }

      async.map(torrents,
                function(item, callback) {
                  if (!item.url) {
                    callback(null, null);
                  } else {
                    if (!item.url.startsWith('http')) {
                      callback(null, null);
                    } else {
                      network.http(item.url, null, null, true, function(err, data) {
                        parseTorrent.remote(data, function(err, parsedTorrent) {
                          if (!err) {
                            item.url = parseTorrent.toMagnetURI(parsedTorrent);
                          }
                          callback(null, null);
                        });
                      });
                    }
                  }
                },
                function(err, results) {
                  for (var key in torrents) {
                    var magnetLink = torrents[key].url;
                    if (magnetLink) {
                      try {
                        var parsedMagnetLink = parseTorrent(magnetLink);

                        if (parsedMagnetLink.dn) {
                          if (!magnets.find(function(element, index, array) { return parseTorrent(element.link).infoHash == parsedMagnetLink.infoHash; })) {
                            var magnetInfo = {
                              title:  parsedMagnetLink.dn,
                              source: torrents[key].provider,
                              link:   magnetLink,
                              size:   0,
                              seeds:  (torrents[key].seeds > 0) ? torrents[key].seeds : -1,
                              peers:  (torrents[key].peers > 0) ? torrents[key].peers : -1
                            };

                            magnetInfo.link = magnet.encode({
                              dn: magnetInfo.title,
                              xt: [ 'urn:btih:' + parsedMagnetLink.infoHash ],
                              tr: parsedMagnetLink.tr
                            });

                            magnets.push(magnetInfo);
                          }
                        }
                      } catch(err) {
                        // Ignore invalid magnet
                      }
                    }
                  }

                  callback(null, magnets);
                });
    }
  });
}
