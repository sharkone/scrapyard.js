var network = require('./network');

// ----------------------------------------------------------------------------

var TRAKT_URL     = 'https://api-v2launch.trakt.tv';
var TRAKT_HEADERS = { 'content-type': 'application/json', 'trakt-api-version': '2', 'trakt-api-key': '64cf92c702ff753cc14a6d421824efcd32f22058f79bf6d637fa92e23229f35f' };


// ----------------------------------------------------------------------------

function trakt(page, params, callback) {
  network.json(TRAKT_URL + page, params, TRAKT_HEADERS, 0, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, data);
    }
  });
}

// ----------------------------------------------------------------------------

exports.moviesPopular = function(page, limit, callback) {
  trakt('/movies/popular', { page: page, limit: limit }, callback);
}

// ----------------------------------------------------------------------------

exports.moviesTrending = function(page, limit, callback) {
  trakt('/movies/trending', { page: page, limit: limit }, callback);
}

// ----------------------------------------------------------------------------

exports.moviesSearch = function(query, callback) {
  trakt('/search', { query: query, type: 'movie' }, callback);
}

// ----------------------------------------------------------------------------

exports.movie = function(slug, callback) {
  trakt('/movies/' + slug, { extended: 'full,images' }, callback);
}

// ----------------------------------------------------------------------------

exports.moviePeople = function(slug, callback) {
  trakt('/movies/' + slug + '/people', { extended: 'images' }, callback);
}

// ----------------------------------------------------------------------------

exports.showsPopular = function(page, limit, callback) {
  trakt('/shows/popular', { page: page, limit: limit }, callback);
}

// ----------------------------------------------------------------------------

exports.showsTrending = function(page, limit, callback) {
  trakt('/shows/trending', { page: page, limit: limit }, callback);
}

// ----------------------------------------------------------------------------

exports.showsSearch = function(query, callback) {
  trakt('/search', { query: query, type: 'show' }, callback);
}

// ----------------------------------------------------------------------------

exports.movie = function(slug, callback) {
  trakt('/movies/' + slug, { extended: 'full,images' }, callback);
}
