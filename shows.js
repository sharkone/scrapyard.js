var async = require('async');
var merge = require('merge');
var trakt = require('trakt-api')('64cf92c702ff753cc14a6d421824efcd32f22058f79bf6d637fa92e23229f35f', { logLevel: 'info'});
var S     = require('string');

// ----------------------------------------------------------------------------

exports.getTrending = function(page, limit, callback) {
  trakt.showTrending({ page: page, limit: limit }, function(err, shows) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, shows.map(function(show) { return show.show.ids.slug; }));
    }
  });
}

// ----------------------------------------------------------------------------

exports.getPopular = function(page, limit, callback) {
  trakt.showPopular({ page: page, limit: limit }, function(err, shows) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, shows.map(function(show) { return show.ids.slug; }));
    }
  });
}

// ----------------------------------------------------------------------------

exports.search = function(query, callback) {
  trakt.searchShow(query, function(err, shows) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, shows.map(function(show) { return show.show.ids.slug; }));
    }
  });
}

// ----------------------------------------------------------------------------

function getInfo(show, callback) {
  trakt.show(show, { extended: 'full,images' }, function(err, showInfoData) {
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
  trakt.showSeasons(show, { extended: 'full,images' }, function(err, showSeasonInfoData) {
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

// // ----------------------------------------------------------------------------

// function getPeople(movie, callback) {
//   trakt.moviePeople(movie, { extended: 'images' }, function(err, moviePeopleData) {
//     if (err) {
//       callback(err, null);
//     } else {
//       var moviePeople = {
//         cast: [],
//         crew: {
//           directing:  [],
//           production: [],
//           writing:    []
//         }
//       };

//       if ('cast' in moviePeopleData) {
//         for (var i = 0; i < moviePeopleData.cast.length; i++) {
//           moviePeople.cast.push({
//             name:       moviePeopleData.cast[i].person.name,
//             headshot:   moviePeopleData.cast[i].person.images.headshot.full,
//             character:  moviePeopleData.cast[i].character
//           });
//         }
//       }

//       if ('crew' in moviePeopleData) {
//         if ('directing' in moviePeopleData.crew) {
//           for (var i = 0; i < moviePeopleData.crew.directing.length; i++) {
//             moviePeople.crew.directing.push({
//               name:     moviePeopleData.crew.directing[i].person.name,
//               headshot: moviePeopleData.crew.directing[i].person.images.headshot.full,
//               job:      moviePeopleData.crew.directing[i].job
//             });
//           }
//         }

//         if ('production' in moviePeopleData.crew) {
//           for (var i = 0; i < moviePeopleData.crew.production.length; i++) {
//             moviePeople.crew.production.push({
//               name:     moviePeopleData.crew.production[i].person.name,
//               headshot: moviePeopleData.crew.production[i].person.images.headshot.full,
//               job:      moviePeopleData.crew.production[i].job
//             });
//           }
//         }

//         if ('writing' in moviePeopleData.crew) {
//           for (var i = 0; i < moviePeopleData.crew.writing.length; i++) {
//             moviePeople.crew.writing.push({
//               name:     moviePeopleData.crew.writing[i].person.name,
//               headshot: moviePeopleData.crew.writing[i].person.images.headshot.full,
//               job:      moviePeopleData.crew.writing[i].job
//             });
//           }
//         }
//       }

//       callback(null, moviePeople);
//     }
//   });
// }

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

exports.getInfos = function(showList, callback) {
  async.map(showList, getInfo, callback);
}
