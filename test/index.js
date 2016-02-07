'use strict';

var assert = require('assert');

var streamAssert = require('stream-assert'),
    touch = require('touch');

var gWB = require('..');

describe('gulp-watchify-browserify', function() {

  it('should create separate bundles by globbing entries', function(done) {
    var streamsCount = 0;
    gWB('./test/fixtures/*.js', {
      watch: false,
      browserify: {paths: ['./test/fixtures/modules']}
    }, function(stream) {
      return stream
        .pipe(streamAssert.length(1))
        .pipe(streamAssert.first(function() {
          streamsCount++;
        }))
        .pipe(streamAssert.end());
    }, function() {
      assert.equal(streamsCount, 2);
      done();
    });
  });

  it('should watch and rebundle', function(done) {
    var streamsCount = 0;
    gWB('./test/fixtures/*.js', {
      watch: true,
      browserify: {paths: ['./test/fixtures/modules']}
    }, function(stream) {
      return stream
        .pipe(streamAssert.length(1))
        .pipe(streamAssert.first(function() {
          streamsCount++;
        }))
        .pipe(streamAssert.end());
    }, function() {
    });
    setTimeout(function() {
      touch('./test/fixtures/modules/hello.js', false, function() {
        setTimeout(function() {
          assert.equal(streamsCount, 4);
          done();
        }, 500);
      });
    }, 1000);
  });

  it('should do nothing if no files found', function(done) {
    gWB('./does/not/exist/**/*', {}, function() {
      throw new Error('FAILED');
    }, function() {
      done();
    });
  });

});
