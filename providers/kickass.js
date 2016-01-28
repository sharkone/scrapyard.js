var async   = require('async');
var kickass = require('kickass-torrent');
var util    = require('util');

function search(query, callback) {
  var torrents = [];

  kickass({ q: query, field: 'seeder', order: 'desc' }, function(err, data) {
    if (err) {
      callback(err, null);
      return;
    }

    for (var i = 0; i < data.list.length; i++) {
      torrents.push({
        title: data.list[i].title,
        hash:  data.list[i].hash,
        size:  data.list[i].size,
        // seeds: data.list[i].seeds,
        // peers: data.list[i].leechs
      });
    }

    callback(null, torrents);
  });
}

exports.movie = function(movieInfo, callback) {
  search('category:movies imdb:' + ((movieInfo.imdb_id != null) ? movieInfo.imdb_id.substring(2) : ''), callback);
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
