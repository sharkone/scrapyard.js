var querystring = require('querystring');
var request     = require('request');

exports.http = function(url, params, headers, timeout, callback) {
  var options = {
    gzip:     true,
    headers:  headers,
    qs:       params,
    time:     true,
    timeout:  timeout,
    url:      url
  };

  var start = new Date().getTime();
  request(options, function(err, response, body) {
    var duration = ((new Date().getTime() - start) / 1000.0).toFixed(1);
    if (duration < 1.0) {
      duration = '0' + duration;
    }

    var queryString = querystring.stringify(params);
    if (queryString.length > 0) {
      queryString = '?' + queryString;
    }

    if (err) {
      console.log('[HTTP][ERR][' + duration + 's] ' + url + queryString);
      callback(err, null);
    } else {
      console.log('[HTTP][HIT][' + duration + 's] ' + url + queryString);
      callback(null, body);
    }
  });
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
