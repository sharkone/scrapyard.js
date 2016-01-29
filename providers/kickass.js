var async   = require('async');
var magnet  = require('magnet-uri');
var util    = require('util');

var network = require('../network');

// ----------------------------------------------------------------------------

var KICKASS_URL = 'https://kat.cr'

// ----------------------------------------------------------------------------

function search(category, query, callback) {
  network.json(KICKASS_URL + '/json.php', { q: 'category:' + category + ' ' + query, field: 'seeders', order: 'desc' }, null, 0, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      var magnets = [];

      for (var i = 0; i < data.list.length; i++) {
        var magnetInfo = {
          title: data.list[i].title,
          size:  data.list[i].size,
          seeds: data.list[i].seeds,
          peers: data.list[i].leechs
        };

        magnetInfo.link = magnet.encode({
          dn: magnetInfo.title,
          xt: [ 'urn:btih:' + data.list[i].hash ],
          tr: [ 'udp://tracker.openbittorrent.com:80',
                'udp://open.demonii.com:1337',
                'udp://tracker.leechers-paradise.org:6969'
              ]
        });

        magnets.push(magnetInfo);
      }

      callback(null, magnets);
    }
  });
}

// ----------------------------------------------------------------------------

exports.movie = function(movieInfo, callback) {
  search('movies', 'imdb:' + ((movieInfo.imdb_id != null) ? movieInfo.imdb_id.substring(2) : ''), callback);
}

// exports.episode = function(showInfo, episodeInfo, callback) {
//   async.parallel([
//     function(callback) {
//       search(util.format('category:tv season:%d episode:%d', episodeInfo.season_index, episodeInfo.episode_index), callback);
//     },
//     function(callback) {
//       search(util.format('category:tv S:%02dE:%02d', episodeInfo.season_index, episodeInfo.episode_index), callback);
//     }],
//     function(err, results) {
//       callback(null, results[0].concat(results[1]));
//     }
//   );
// }
