var LRU         = require('lru-cache');
var querystring = require('querystring');
var request     = require('request');
var zlib        = require('zlib');

// ----------------------------------------------------------------------------

var TIMEOUT_INITIAL = 20000;
var TIMEOUT_UPDATE  = 5000;

// ----------------------------------------------------------------------------

exports.cache = new LRU({
  max:    7500,
  maxAge: 60 * 60 * 1000,
  stale: true
});

// ----------------------------------------------------------------------------

function getFullURL(url, params) {
  var queryString = querystring.stringify(params);
  if (queryString.length > 0) {
    queryString = '?' + queryString;
  }
  return url + queryString;
}

// ----------------------------------------------------------------------------

function getDuration(startTime) {
  var duration = ((new Date().getTime() - startTime) / 1000.0).toFixed(1);
  if (duration < 10.0) {
    duration = '0' + duration;
  }
  return duration;
}

// ----------------------------------------------------------------------------

function http(url, params, headers, binary, timeout, startTime, callback) {
  var options = {
    gzip:     true,
    headers:  headers,
    qs:       params,
    timeout:  timeout,
    url:      url
  };

  if (binary) {
    options.encoding = null;
  }

  request(options, function(err, response, body) {
    if (err) {
      callback(err, null);
    } else if (response.statusCode != 200) {
      callback({ statusCode: response.statusCode }, null);
    } else {
      callback(null, body);
    }
  });
}

// ----------------------------------------------------------------------------

exports.http = function(url, params, headers, binary, callback) {
  var startTime = new Date().getTime();

  var key   = getFullURL(url, params);
  var value = exports.cache.peek(key);

  // Value doesn't exist in cache, force update
  if (!value) {
    http(url, params, headers, binary, TIMEOUT_INITIAL, startTime, function(err, body) {
      if (err) {
        console.log('[HTTP][ERR][' + getDuration(startTime) + 's] ' + getFullURL(url, params) + ' (' + err.message + ')');
        callback(err, null);
      } else {
        console.log('[HTTP][NET][' + getDuration(startTime) + 's] ' + getFullURL(url, params));
        exports.cache.set(key, zlib.gzipSync(body));
        callback(null, body);
      }
    });
  } else {
    var getValue = exports.cache.get(key);
    if (!getValue) {
      // Value is outdated, try and update it
      http(url, params, headers, binary, TIMEOUT_UPDATE, startTime, function(err, body) {
        if (err) {
          // Failed to update, return previous value
          console.log('[HTTP][FLB][' + getDuration(startTime) + 's] ' + getFullURL(url, params) + ' (' + err.message + ')');
          exports.cache.set(key, value);

          value = zlib.gunzipSync(value);
          if (!binary) {
            value = value.toString();
          }
          callback(null, value);
        } else {
          // Update cache and return new value
          console.log('[HTTP][UPD][' + getDuration(startTime) + 's] ' + getFullURL(url, params));
          exports.cache.set(key, zlib.gzipSync(body));
          callback(null, body);
        }
      });
    } else {
      // Value is still in cache
      // console.log('[HTTP][MEM][' + getDuration(startTime) + 's] ' + getFullURL(url, params));

      getValue = zlib.gunzipSync(getValue);
      if (!binary) {
        getValue = getValue.toString();
      }
      callback(null, getValue);
    }
  }
}

// ----------------------------------------------------------------------------

exports.json = function(url, params, headers, callback) {
  exports.http(url, params, headers, false, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      try {
        var jsonData = JSON.parse(data)
        callback(null, jsonData);
      } catch(err) {
        callback(err, null);
      }
    }
  });
}
