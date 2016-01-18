require('newrelic');

// ----------------------------------------------------------------------------

var app        = require('express')();
var bodyParser = require('body-parser');
var movies     = require('./movies');

// ----------------------------------------------------------------------------

var VERSION = '0.0.1';

// ----------------------------------------------------------------------------

app.set('json spaces', 2);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var server = app.listen(process.env.PORT || 5000, process.env.IP || '0.0.0.0', function() {
  console.log('[scrapyard] Starting on %s:%s', server.address().address, server.address().port);
});

// ----------------------------------------------------------------------------

app.get('/', function(req, res) {
  res.json({ version: VERSION });
});

// ----------------------------------------------------------------------------

app.get('/api/movies/trending', function(req, res) {
  movies.getTrending(parseInt(req.query.page, 10) || 1, 31, function(err, movieList) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      movies.getInfos(movieList, function(err, movieInfos) {
        if (err) {
          res.sendStatus(err['statusCode']);
        }
        else {
          res.json({ movies: movieInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/movies/popular', function(req, res) {
  movies.getPopular(parseInt(req.query.page, 10) || 1, 31, function(err, movieList) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      movies.getInfos(movieList, function(err, movieInfos) {
        if (err) {
          res.sendStatus(err['statusCode']);
        }
        else {
          res.json({ movies: movieInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/movies/search', function(req, res) {
  movies.search(req.query.query || '', function(err, movieList) {
    if (err) {
      res.sendStatus(err['statusCode']);
    } else {
      movies.getInfos(movieList, function(err, movieInfos) {
        if (err) {
          res.sendStatus(err['statusCode']);
        }
        else {
          res.json({ movies: movieInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.post('/api/movies/watchlist', function(req, res) {
  movies.getInfos(JSON.parse(req.body.movies_watchlist) || [], function(err, movieInfos) {
    if (err) {
      res.sendStatus(err['statusCode']);
    }
    else {
      res.json({ movies: movieInfos });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/movie/:trakt_slug', function(req, res) {
  movies.getInfo(req.params.trakt_slug, function(err, movieInfo) {
    if (err)
      res.sendStatus(err['statusCode']);
    else
      res.json(movieInfo);
  });
});

// ----------------------------------------------------------------------------

// movies.getTrending(1, 1, function(err, movieList) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     movies.getInfos(movieList, function(err, movieInfos) {
//       if (err) {
//         console.log(err);
//       }
//       else {
//         console.log(JSON.stringify(movieInfos, null, 2));
//       }
//     });
//   }
// });

// ----------------------------------------------------------------------------

// movies.getInfo('interstellar-2014', function(err, movieInfo) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     console.log(JSON.stringify(movieInfo, null, 2));  }
// });

// ----------------------------------------------------------------------------

// movies.search('Interstellar', function(err, movieList) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     movies.getInfos(movieList, function(err, movieInfos) {
//       if (err) {
//         console.log(err);
//       }
//       else {
//         console.log(JSON.stringify(movieInfos, null, 2));
//       }
//     });
//   }
// });
