var async = require('async');

var scraper = require('./scraper');
var eztv    = require('./providers/eztv');
var kickass = require('./providers/kickass');

// ----------------------------------------------------------------------------

exports.movie = function(movieInfo, callback) {
  async.parallel(
    [
      function(callback) {
        kickass.movie(movieInfo, callback);
      }
    ],
    function(err, results) {
      if (err) {
        callback(err, null);
      } else {
        movieMagnets = [];
        for (var i = 0; i < results.length; i++) {
          movieMagnets = mergeMagnetLists(movieMagnets, results[i]);
        }

        scrapeMagnets(movieMagnets, function(err, scrapedMovieMagnets) {
          movieMagnets = scrapedMovieMagnets.filter(function(magnet) { return magnet.seeds > 0; });
          movieMagnets.sort(function(a, b) { return b.seeds - a.seeds; });
          callback(null, movieMagnets);
        });
      }
    }
  );
}

// ----------------------------------------------------------------------------

exports.episode = function(showInfo, seasonIndex, episodeIndex, callback) {
  async.parallel(
    [
      function(callback) {
        eztv.episode(showInfo, seasonIndex, episodeIndex, callback);
      },
      function(callback) {
        kickass.episode(showInfo, seasonIndex, episodeIndex, callback);
      }
    ],
    function(err, results) {
      if (err) {
        callback(err, null);
      } else {
        episodeMagnets = [];
        for (var i = 0; i < results.length; i++) {
          episodeMagnets = mergeMagnetLists(episodeMagnets, results[i]);
        }
        scrapeMagnets(episodeMagnets, function(err, scrapedEpisodeMagnets) {
          episodeMagnets = scrapedEpisodeMagnets.filter(function(magnet) { return magnet.seeds > 0; });
          episodeMagnets.sort(function(a, b) { return b.seeds - a.seeds; });
          callback(null, episodeMagnets);
        });
      }
    }
  );
}

// ----------------------------------------------------------------------------

function scrapeMagnets(magnets, callback) {
  async.each(magnets,
    function(magnet, callback) {
      scraper.scrape(magnet.link, function(err, scrapeResults) {
        if (!err) {
          magnet.seeds = scrapeResults.seeds;
          magnet.peers = scrapeResults.peers;
        }
        callback();
      })
    },
    function(err) {
      callback(null, magnets);
    }
  );
}

// ----------------------------------------------------------------------------

function mergeMagnetLists(list1, list2) {
  var toAdd = [];

  if (list2) {
    for (var i = 0; i < list2.length; i++) {
      var alreadyAdded = false;

      for (var j = 0; j < list1.length; j++) {
        if (list2[i].link == list1[j].link) {
          list1[j].size  = Math.max(list1[j].size,  list2[i].size);
          list1[j].seeds = Math.max(list1[j].seeds, list2[i].seeds);
          list1[j].peers = Math.max(list1[j].peers, list2[i].peers);
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
