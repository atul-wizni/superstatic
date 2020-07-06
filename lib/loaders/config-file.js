/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://github.com/firebase/superstatic/blob/master/LICENSE
 */
'use strict';

var fs = require('fs');

var _ = require('lodash');
var join = require('join-path');
var path = require('path');
var patterns = require('../utils/patterns');

var CONFIG_FILE = ['superstatic.json', 'firebase.json'];

module.exports = function(filename) {
  if (_.isFunction(filename)) { return filename; }

  filename = filename || CONFIG_FILE;

  var configObject = {};
  var config = {};

  // From custom config data passed in
  try {
    configObject = JSON.parse(filename);
  } catch (e) {
    if (_.isPlainObject(filename)) {
      configObject = filename;
      filename = CONFIG_FILE;
    }
  }

  if (_.isArray(filename)) {
    filename = _.find(filename, function(name) {
      return fs.existsSync(join(process.cwd(), name));
    });
  }

  // Set back to default config file if stringified object is
  // given as config. With this, we override values in the config file
  if (_.isPlainObject(filename)) {
    filename = CONFIG_FILE;
  }


  // A file name or array of file names
  if (_.isString(filename) && _.endsWith(filename, 'json')) {
    try {
      config = JSON.parse(fs.readFileSync(path.resolve(filename)));
      config = config.hosting ? config.hosting : config;
    } catch (e) {
      // do nothing
    }
  }

  // Passing an object as the config value merges
  // the config data
  var compiled = _.assign(config, configObject);

  // Check the rewrites/redirects/headers for fields that might break based on
  // Firebase Hosting accepting only RE2, but RE2 being an optional dependency
  // in Superstatic.
  if (_.isArray(compiled.rewrites)) {
    _.each(compiled.rewrites, function(rewrite) {
      if (patterns.containsRE2Capture(rewrite.regex) && !patterns.re2Available()) {
        console.log('Warning: RE2 is not currently installed, and your configured rewrite ' + rewrite.regex + ' appears to use RE2 capturing groups.');
        console.log('This rewrite is unlikely to behave as intended, until you install the RE2 optional dependency.');
      }
      if (patterns.containsPCRECapture(rewrite.regex)) {
        console.log('Warning: your configured rewrite ' + rewrite.regex + ' appears to use PCRE regular expression syntax for named capture groups.');
        if (patterns.re2Available()) {
          console.log('This rewrite is unlikely to behave as intended, unless you use RE2 syntax (?P<> instead of ?<>).');
        } else {
          console.log('Although this will work locally, it will not work if you install the RE2 optional dependency, or you deploy to Firebase Hosting.');
        }
      }
    });
  }
  if (_.isArray(compiled.redirects)) {
    _.each(compiled.rewrites, function(redirect) {
      if (patterns.containsRE2Capture(redirect.regex) && !patterns.re2Available()) {
        console.log('Warning: RE2 is not currently installed, and your configured redirect ' + redirect.regex + ' appears to use RE2 capturing groups.');
        console.log('This redirect is unlikely to behave as intended, until you install the RE2 optional dependency.');
      }
      if (patterns.containsPCRECapture(redirect.regex)) {
        console.log('Warning: your configured redirect ' + redirect.regex + ' appears to use PCRE regular expression syntax for named capture groups.');
        if (patterns.re2Available()) {
          console.log('This redirect is unlikely to behave as intended, unless you use RE2 syntax (?P<> instead of ?<>).');
        } else {
          console.log('Although this will work locally, it will not work if you install the RE2 optional dependency, or you deploy to Firebase Hosting.');
        }
      }
    });
  }
  if (_.isArray(compiled.headers)) {
    _.each(compiled.headers, function(header) {
      if (patterns.containsRE2Capture(header.regex) && !patterns.re2Available()) {
        console.log('Warning: RE2 is not currently installed, and your configured custom header ' + header.regex + ' appears to use RE2 capturing groups.');
        console.log('This header is unlikely to behave as intended, until you install the RE2 optional dependency.');
      }
      if (patterns.containsPCRECapture(header.regex)) {
        console.log('Warning: your configured custom header ' + header.regex + ' appears to use PCRE regular expression syntax for named capture groups.');
        if (patterns.re2Available()) {
          console.log('This header is unlikely to behave as intended, unless you use RE2 syntax (?P<> instead of ?<>).');
        } else {
          console.log('Although this will work locally, it will not work if you install the RE2 optional dependency, or you deploy to Firebase Hosting.');
        }
      }
    });
  }

  return compiled;
};
