require('newrelic');

var app        = require('express')();
var bodyParser = require('body-parser');

var movies     = require('./movies')
var network    = require('./network');
var scraper    = require('./scraper');
var shows      = require('./shows');

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
  res.json({
    version: VERSION,
    network_cache: network.cache.itemCount,
    scraper_cache: scraper.cache.itemCount,
  });
});

// ----------------------------------------------------------------------------

app.get('/api/movies/trending', function(req, res) {
  movies.getTrending(parseInt(req.query.page, 10) || 1, 31, function(err, movieList) {
    if (err) {
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      movies.getInfos(movieList, function(err, movieInfos) {
        if (err) {
          res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
        } else {
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
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      movies.getInfos(movieList, function(err, movieInfos) {
        if (err) {
          res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
        } else {
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
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      movies.getInfos(movieList, function(err, movieInfos) {
        if (err) {
          res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
        } else {
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
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      res.json({ movies: movieInfos });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/movie/:trakt_slug', function(req, res) {
  movies.getInfo(req.params.trakt_slug, function(err, movieInfo) {
    if (err) {
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      res.json(movieInfo);
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/shows/trending', function(req, res) {
  shows.getTrending(parseInt(req.query.page, 10) || 1, 31, function(err, showList) {
    if (err) {
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      shows.getInfos(showList, function(err, showInfos) {
        if (err) {
          res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
        } else {
          res.json({ shows: showInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/shows/popular', function(req, res) {
  shows.getPopular(parseInt(req.query.page, 10) || 1, 31, function(err, showList) {
    if (err) {
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      shows.getInfos(showList, function(err, showInfos) {
        if (err) {
          res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
        } else {
          res.json({ shows: showInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/shows/search', function(req, res) {
  shows.search(req.query.query || '', function(err, showList) {
    if (err) {
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      shows.getInfos(showList, function(err, showInfos) {
        if (err) {
          res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
        } else {
          res.json({ shows: showInfos });
        }
      });
    }
  });
});

// ----------------------------------------------------------------------------

app.post('/api/shows/favorites', function(req, res) {
  shows.getInfos(JSON.parse(req.body.shows_favorites) || [], function(err, showInfos) {
    if (err) {
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      res.json({ shows: showInfos });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/show/:trakt_slug', function(req, res) {
  shows.getInfo(req.params.trakt_slug, function(err, showInfo) {
    if (err) {
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      res.json(showInfo);
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/show/:trakt_slug/season/:season_index', function(req, res) {
  shows.getSeason(req.params.trakt_slug, parseInt(req.params.season_index, 10) || 1, function(err, seasonInfo) {
    if (err) {
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      res.json({ episodes: seasonInfo });
    }
  });
});

// ----------------------------------------------------------------------------

app.get('/api/show/:trakt_slug/season/:season_index/episode/:episode_index', function(req, res) {
  shows.getEpisode(req.params.trakt_slug, parseInt(req.params.season_index, 10) || 1, parseInt(req.params.episode_index, 10) || 1, function(err, episodeInfo) {
    if (err) {
      res.status(('statusCode' in err) ? err['statusCode'] : 500).send(err);
    } else {
      res.json(episodeInfo);
    }
  });
});
