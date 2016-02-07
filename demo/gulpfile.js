'use strict';

var path = require('path');

var eslintify = require('eslintify'),
    gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    plumber = require('gulp-plumber'),
    runSequence = require('run-sequence'),
    uglifyify = require('uglifyify');

var gulpWB = require('..');

// "global" variable for watch mode
var watch = false;

/**
 * Browserify / Watchify task
 */
gulp.task('browserify', function(done) {

  var src = './src',
      dest = './dest';

  var options = {
    // watch mode
    watch: watch,
    // set cwd to manipulate relative output path
    cwd: src,
    browserify: {
      paths: [
        path.join(src, 'modules'),
        './node_modules'
      ],
      debug: true,
      transform: [
        eslintify,
        [uglifyify, {global: true}]
      ]
    }
  };

  gulpWB('*.js', options, streamHandler.bind(this), done);

  /**
   * stream handler to apply further gulp plugins
   * @param  {Object} stream  gulp file stream
   * @return {Object}         processed stream
   */
  function streamHandler(stream) {
    return stream
      .pipe(plumber())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('.', {includeContent: true, sourceRoot: '.'}))
      .pipe(gulp.dest(dest));
  }

});

// task for enabling watch mode
gulp.task('enable-watchify', function(done) {
  watch = true;
  done();
});

// enable watch mode and start browserify
gulp.task('watchify', function(done) {
  runSequence('enable-watchify', 'browserify', done);
});

// set default task
gulp.task('default', ['browserify']);
