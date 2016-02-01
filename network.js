var LRU         = require('lru-cache')
var querystring = require('querystring');
var request     = require('request');
var zlib        = require('zlib');

var cache = new LRU();

function getFullURL(url, params) {
  var queryString = querystring.stringify(params);
  if (queryString.length > 0) {
    queryString = '?' + queryString;
  }
  return url + queryString;
}

function getDuration(startTime) {
  var duration = ((new Date().getTime() - startTime) / 1000.0).toFixed(1);
  if (duration < 1.0) {
    duration = '0' + duration;
  }
  return duration;
}

exports.http = function(url, params, headers, timeout, callback) {
  var startTime = new Date().getTime();

  var key   = getFullURL(url, params);
  var value = cache.get(key);
  if (value) {
    console.log('[HTTP][MEM][' + getDuration(startTime) + 's] ' + getFullURL(url, params));
    callback(null, zlib.gunzipSync(value).toString());
  } else {
    var options = {
      gzip:     true,
      headers:  headers,
      qs:       params,
      time:     true,
      timeout:  timeout,
      url:      url
    };

    request(options, function(err, response, body) {
      if (err) {
        console.log('[HTTP][ERR][' + getDuration(startTime) + 's] ' + getFullURL(url, params));
        callback(err, null);
      } else {
        console.log('[HTTP][NET][' + getDuration(startTime) + 's] ' + getFullURL(url, params));
        cache.set(key, zlib.gzipSync(body));
        callback(null, body);
      }
    });
  }
}

exports.json = function(url, params, headers, timeout, callback) {
  exports.http(url, params, headers, timeout, function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      try {
        var jsonData = JSON.parse(data)
      } catch(err) {
        callback(err, null);
      }
      callback(null, jsonData);
    }
  });
}

