'use strict';

var path = require('path'),
    util = require('util');

var browserify = require('browserify'),
    eventStream = require('event-stream'),
    glob = require('glob'),
    gUtil = require('gulp-util'),
    merge = require('merge'),
    buffer = require('vinyl-buffer'),
    source = require('vinyl-source-stream'),
    watchify = require('watchify');

var chalk = gUtil.colors,
    format = util.format,
    log = gUtil.log;

module.exports = gulpWatchifyBrowserify;

/**
 * gulp plugin for watching and bundling javascripts using watchify and browserify
 * @param  {String}    globPattern    glob pattern for entries
 * @param  {Object}    options        custom options
 * @param  {Function}  streamHandler  stream handler for using more gulp plugins and pipe to dest
 * @param  {Function}  done           callback
 * @return {undefined}
 */
function gulpWatchifyBrowserify(globPattern, options, streamHandler, done) {

  options = merge.recursive({
    watch: process.env.NODE_ENV === 'development',
    cwd: process.cwd(),
    browserify: {
      insertGlobals: false,
      cache: {},
      packageCache: {}
    },
    watchify: {
      delay: 100,
      ignoreWatch: ['**/node_modules/**'],
      poll: true
    }
  }, options || {});

  /**
   * glob bundle entries using defined pattern,
   * create a bundler for each file,
   * merge output streams from bundlers,
   * callback on stream end
   */
  glob(globPattern, {cwd: options.cwd}, function(err, files) {
    if (err) return log(err);
    if (files.length <= 0) return done();
    eventStream.merge(files.map(function(file) {
      var bundler = new Bundler(file);
      return bundler.outputBundle();
    })).on('end', function() {
      if (options.watch) return;
      done();
    });
  });

  /**
   * create a browserify bundler, wrapped in a watchify watcher
   * @param  {String} file  entry file
   * @return {undefined}
   */
  function Bundler(file) {

    var bundler = this, bundle,
        watchMsg = format('Watching bundle %s...', chalk.magenta(file));

    // set entry file for this bundler
    options.browserify.entries = [path.join(options.cwd, file)];

    // initiate bundle
    bundle = watchify(browserify(options.browserify), options.watchify);

    /**
     * on update, log to console and bundle
     * @param  {Array} ev  array of event files
     * @return {undefined}
     */
    bundle.on('update', function(ev) {
      log(format('%s File %s updated. Bundling %s ...',
        chalk.yellow('☀'),
        chalk.magenta(path.relative(options.cwd, ev[0])),
        chalk.magenta(file)
      ));
      bundler.outputBundle();
    });

    /**
     * when bundling, log infos to console
     * @param  {String} msg  bundling info
     * @return {undefined}
     */
    bundle.on('log', function(msg) {
      log(format('%s Bundled %s %s',
        chalk.green('✓'),
        chalk.magenta(file),
        chalk.gray(msg)
      ));
    });

    /**
     * bundle and transform to stream
     * @return {Object} gulp stream
     */
    this.outputBundle = function() {
      return streamHandler(
        bundle.bundle()
          .on('error', function(err) {
            log(chalk.red(format('✖ Bundling failed for %s %s',
              chalk.magenta(file),
              chalk.gray('(' + String(err) + ')')
            )));
            this.emit('end');
          })
          .pipe(source(file))
          .pipe(buffer())
          .on('end', function() {
            if (!options.watch) bundle.close();
            else if (watchMsg) {
              log(watchMsg);
              watchMsg = false;
            }
          })
      );
    };

  }

}
