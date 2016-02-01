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
  search('movies', 'imdb:' + ((movieInfo.imdb_id != null) ? movieInfo.imdb_id.substring(2) : ''), function(err, movieMagnets) {
    movieMagnets.sort(function(a, b) { return b.seeds - a.seeds; });
    callback(null, movieMagnets);
  });
}

// ----------------------------------------------------------------------------

exports.episode = function(showInfo, seasonIndex, episodeIndex, callback) {
  async.parallel(
    [
      function(callback) {
        search('tv', util.format('%s season:%d episode:%d', showInfo.title, seasonIndex, episodeIndex), callback);
      },
      function(callback) {
        var season = seasonIndex.toString();
        if (seasonIndex < 10) {
          season = '0' + season;
        }
        var episode = episodeIndex.toString();
        if (episodeIndex < 10) {
          episode = '0' + episode;
        }
        search('tv', util.format('%s S%sE%s', showInfo.title, season, episode), callback);
      }
    ],
    function(err, results) {
      episodeMagnets = mergeMagnetLists(results[0], results[1]);
      episodeMagnets.sort(function(a, b) { return b.seeds - a.seeds; });
      callback(null, episodeMagnets);
    }
  );
}

function mergeMagnetLists(list1, list2) {
  var toAdd = [];

  if (list2) {
    for (var i = 0; i < list2.length; i++) {
      var alreadyAdded = false;

      for (var j = 0; j < list1.length; j++) {
        if (list2[i].link == list1[j].link) {
          alreadyAdded = true;
          break;
        }
      }

      if (!alreadyAdded) {
        toAdd.push(list2[i]);
      }
    }
  }

  return list1.concat(toAdd);
}
