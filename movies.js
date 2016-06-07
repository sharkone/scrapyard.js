var async = require('async');
var merge = require('merge');
var S     = require('string');

var providers = require('./providers');
var trakt     = require('./trakt');

// ----------------------------------------------------------------------------

exports.getTrending = function(page, limit, callback) {
  trakt.moviesTrending(page, limit, function(err, movies) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, movies.map(function(movie) { return movie.movie.ids.slug; }));
    }
  });
}

// ----------------------------------------------------------------------------

exports.getPopular = function(page, limit, callback) {
  trakt.moviesPopular(page, limit, function(err, movies) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, movies.map(function(movie) { return movie.ids.slug; }));
    }
  });
}

// ----------------------------------------------------------------------------

exports.search = function(query, callback) {
  trakt.moviesSearch(query, function(err, movies) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, movies.map(function(movie) { return movie.movie.ids.slug; }));
    }
  });
}

// ----------------------------------------------------------------------------

function getInfo(movie, callback) {
  trakt.movie(movie, function(err, movieInfoData) {
    if (err) {
      callback(err, null);
    } else {
      var movieInfo = {
        trakt_slug:     movieInfoData.ids.slug,
        imdb_id:        movieInfoData.ids.imdb,
        title:          movieInfoData.title,
        year:           movieInfoData.year,
        overview:       movieInfoData.overview,
        tagline:        movieInfoData.tagline,
        thumb:          movieInfoData.images.poster.full,
        art:            movieInfoData.images.fanart.full,
        runtime:        movieInfoData.runtime * 60 * 1000,
        genres:         (movieInfoData.genres) ? movieInfoData.genres.map(function(x) { return S(x).capitalize().s; }) : [],
        rating:         movieInfoData.rating,
        released:       movieInfoData.released,
        certification:  movieInfoData.certification
      };

      callback(null, movieInfo);
    }
  });
}

// ----------------------------------------------------------------------------

function getMagnets(movieInfo, callback) {
  providers.movie(movieInfo, function(err, movieMagnets) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, { magnets: movieMagnets });
    }
  });
}

// ----------------------------------------------------------------------------

function getPeople(movie, callback) {
  trakt.moviePeople(movie, function(err, moviePeopleData) {
    if (err) {
      callback(err, null);
    } else {
      var moviePeople = {
        cast: [],
        crew: {
          directing:  [],
          production: [],
          writing:    []
        }
      };

      if ('cast' in moviePeopleData) {
        for (var i = 0; i < moviePeopleData.cast.length; i++) {
          moviePeople.cast.push({
            name:       moviePeopleData.cast[i].person.name,
            headshot:   moviePeopleData.cast[i].person.images.headshot.full,
            character:  moviePeopleData.cast[i].character
          });
        }
      }

      if ('crew' in moviePeopleData) {
        if ('directing' in moviePeopleData.crew) {
          for (var i = 0; i < moviePeopleData.crew.directing.length; i++) {
            moviePeople.crew.directing.push({
              name:     moviePeopleData.crew.directing[i].person.name,
              headshot: moviePeopleData.crew.directing[i].person.images.headshot.full,
              job:      moviePeopleData.crew.directing[i].job
            });
          }
        }

        if ('production' in moviePeopleData.crew) {
          for (var i = 0; i < moviePeopleData.crew.production.length; i++) {
            moviePeople.crew.production.push({
              name:     moviePeopleData.crew.production[i].person.name,
              headshot: moviePeopleData.crew.production[i].person.images.headshot.full,
              job:      moviePeopleData.crew.production[i].job
            });
          }
        }

        if ('writing' in moviePeopleData.crew) {
          for (var i = 0; i < moviePeopleData.crew.writing.length; i++) {
            moviePeople.crew.writing.push({
              name:     moviePeopleData.crew.writing[i].person.name,
              headshot: moviePeopleData.crew.writing[i].person.images.headshot.full,
              job:      moviePeopleData.crew.writing[i].job
            });
          }
        }
      }

      callback(null, moviePeople);
    }
  });
}

// ----------------------------------------------------------------------------

exports.getInfo = function(movie, callback) {
  var movieInfoFull = {};

  async.parallel(
    [
      function(callback) {
        getInfo(movie, function(err, movieInfo) {
          if (err) {
            callback(err, null);
          } else {
            movieInfoFull = merge(movieInfoFull, movieInfo);

            getMagnets(movieInfoFull, function(err, movieMagnets) {
              if (err) {
                callback(err, null);
              } else {
                movieInfoFull = merge(movieInfoFull, movieMagnets);
                callback(null, null);
              }
            });
          }
        });
      },
      function(callback) {
        getPeople(movie, function(err, moviePeople) {
          if (err) {
            callback(err, null);
          } else {
            movieInfoFull = merge(movieInfoFull, moviePeople);
            callback(null, null);
          }
        });
      }
    ],
    function(err, results) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, movieInfoFull);
      }
    }
  );
}

// ----------------------------------------------------------------------------

exports.getInfos = function(movieList, callback) {
  async.map(movieList, getInfo, callback);
}
