var async = require('async');
var merge = require('merge');
var S     = require('string');

var providers = require('./providers');
var trakt     = require('./trakt');

// ----------------------------------------------------------------------------

function getInfo(show, callback) {
  trakt.show(show, function(err, showInfoData) {
    if (err) {
      callback(err, null);
    } else {
      var showInfo = {
        trakt_slug:     showInfoData.ids.slug,
        imdb_id:        showInfoData.ids.imdb,
        title:          showInfoData.title,
        year:           showInfoData.year,
        overview:       showInfoData.overview,
        studio:         showInfoData.network,
        thumb:          showInfoData.images.poster.full,
        art:            showInfoData.images.fanart.full,
        runtime:        showInfoData.runtime * 60 * 1000,
        genres:         showInfoData.genres.map(function(x) { return S(x).capitalize().s; }),
        rating:         showInfoData.rating,
        first_aired:    showInfoData.first_aired,
        certification:  showInfoData.certification
      };

      callback(null, showInfo);
    }
  });
}

// ----------------------------------------------------------------------------

function getSeasons(show, callback) {
  trakt.showSeasons(show, function(err, showSeasonInfoData) {
    if (err) {
      callback(err, null);
    } else {
      var showSeasonInfo = {
        seasons: []
      };

      for (var i = 0; i < showSeasonInfoData.length; i++) {
        if (showSeasonInfoData[i].number > 0) {
          showSeasonInfo.seasons.push({
            season_index:   showSeasonInfoData[i].number,
            title:          'Season ' + showSeasonInfoData[i].number,
            overview:       showSeasonInfoData[i].overview,
            episode_count:  showSeasonInfoData[i].episode_count,
            thumb:          showSeasonInfoData[i].images.poster.full,
          });
        }
      }

      callback(null, showSeasonInfo);
    }
  });
}

// ----------------------------------------------------------------------------

function getSeason(show, seasonIndex, callback) {
  getInfo(show, function(err, showInfo) {
    if (err) {
      callback(err, null);
    } else {
      trakt.showSeason(show, seasonIndex, function(err, showSeasonInfoData) {
        if (err) {
          callback(err, null);
        } else {
          var showSeasonInfo = [];
          for (var i = 0; i < showSeasonInfoData.length; i++) {
            if (showSeasonInfoData[i].first_aired) {
              showSeasonInfo.push({
                show_title:     showInfo.title,
                season_index:   showSeasonInfoData[i].season,
                episode_index:  showSeasonInfoData[i].number,
                title:          showSeasonInfoData[i].title,
                thumb:          showSeasonInfoData[i].images.screenshot.full,
                art:            showSeasonInfoData[i].images.screenshot.full,
                overview:       showSeasonInfoData[i].overview,
                rating:         showSeasonInfoData[i].rating,
                first_aired:    showSeasonInfoData[i].first_aired,
              });
            }
          }

          callback(null, showSeasonInfo);
        }
      });
    }
  });
}

// ----------------------------------------------------------------------------

function getEpisode(show, seasonIndex, episodeIndex, callback) {
  getSeason(show, seasonIndex, function(err, seasonInfo) {
    if (err) {
      callback(err, null);
    } else {
      for (var i = 0; i < seasonInfo.length; i++) {
        if (seasonInfo[i].episode_index == episodeIndex) {
          callback(null, seasonInfo[i]);
          return;
        }
      }
      callback('Invalid episode index', null);
    }
  });
}

// ----------------------------------------------------------------------------

function getMagnets(showInfo, seasonIndex, episodeIndex, callback) {
  providers.episode(showInfo, seasonIndex, episodeIndex, function(err, episodeMagnetData) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, { magnets: episodeMagnetData });
    }
  });
}

// ----------------------------------------------------------------------------

exports.getTrending = function(page, limit, callback) {
  trakt.showsTrending(page, limit, function(err, shows) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, shows.map(function(show) { return show.show.ids.slug; }));
    }
  });
}

// ----------------------------------------------------------------------------

exports.getPopular = function(page, limit, callback) {
  trakt.showsPopular(page, limit, function(err, shows) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, shows.map(function(show) { return show.ids.slug; }));
    }
  });
}

// ----------------------------------------------------------------------------

exports.search = function(query, callback) {
  trakt.showsSearch(query, function(err, shows) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, shows.map(function(show) { return show.show.ids.slug; }));
    }
  });
}

// ----------------------------------------------------------------------------

exports.getInfos = function(showList, callback) {
  async.map(showList, getInfo, callback);
}

// ----------------------------------------------------------------------------

exports.getInfo = function(show, callback) {
  var showInfoFull = {};

  async.parallel(
    [
      function(callback) {
        getInfo(show, function(err, showInfo) {
          if (err) {
            callback(err, null);
          } else {
            showInfoFull = merge(showInfoFull, showInfo);
            callback(null, null);
          }
        });
      },
      function(callback) {
        getSeasons(show, function(err, showSeasonInfo) {
          if (err) {
            callback(err, null);
          } else {
            showInfoFull = merge(showInfoFull, showSeasonInfo);
            callback(null, null);
          }
        });
      }
    ],
    function(err, results) {
      if (err) {
        callback(err, null);
      } else {
        for (var i = 0; i < showInfoFull.seasons.length; i++) {
          showInfoFull.seasons[i].art        = showInfoFull.art;
          showInfoFull.seasons[i].show_title = showInfoFull.title;
        }
        callback(null, showInfoFull);
      }
    }
  );
}

// ----------------------------------------------------------------------------

exports.getSeason = function(show, seasonIndex, callback) {
  getSeason(show, seasonIndex, callback);
}

// ----------------------------------------------------------------------------

exports.getEpisode = function(show, seasonIndex, episodeIndex, callback) {
  var episodeInfoFull = {};

  async.parallel(
    [
      function(callback) {
        getEpisode(show, seasonIndex, episodeIndex, function(err, episodeInfo) {
          if (err) {
            callback(err, null);
          } else {
            episodeInfoFull = merge(episodeInfoFull, episodeInfo);
            callback(null, null);
          }
        });
      },
      function(callback) {
        getInfo(show, function(err, showInfo) {
          if (err) {
            callback(err, null);
          } else {
            getMagnets(showInfo, seasonIndex, episodeIndex, function(err, episodeMagnets) {
              if (err) {
                callback(err, null);
              } else {
                episodeInfoFull = merge(episodeInfoFull, episodeMagnets);
                callback(null, null);
              }
            });
          }
        });
      }
    ],
    function(err, results) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, episodeInfoFull);
      }
    }
  );
}
