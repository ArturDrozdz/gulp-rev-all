var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var toolFactory = require('./tool');
var through = require('through2');
var chalk = require('chalk');
var gutil = require('gulp-util');

var plugin = function (options) {

    options = options || {};
    options.hashLength  = options.hashLength || 8;
    options.ignore = options.ignore || options.ignoredExtensions || [ /^\/favicon.ico$/g ];

    var tool = toolFactory(options);

    return through.obj(function (file, enc, callback) {

        if (file.isNull()) {
            return callback(null, file);
        } else if (file.isStream()) {
            throw new Error('Streams are not supported!');
        } 

        tool.revisionFile(file);
        callback(null, file);

    });    

};


// Borrowed from: https://github.com/sindresorhus/gulp-rev
plugin.manifest = function (options) {

    var options = options || {};
    var manifest  = {};
    var firstFile = null;
    var tool = toolFactory();
    var fileName = options.fileName || 'rev-manifest.json';
    var prefix = options.prefix || '';

    return through.obj(function (file, enc, cb) {

        // ignore all non-rev'd files
        if (file.path && file.revOrigPath) {
            firstFile = firstFile || file;
            manifest[tool.getRelativeFilename(file.revOrigBase, file.revOrigPath, true)] = prefix + tool.getRelativeFilename(file.base, file.path, true);
        }
        cb();

    }, function (cb) {
        
        if (firstFile) {
            this.push(new gutil.File({
                cwd: firstFile.cwd,
                base: firstFile.base,
                path: path.join(firstFile.base, fileName),
                contents: new Buffer(JSON.stringify(manifest, null, '  '))
            }));
        }
        cb();

    });
};

module.exports = plugin;
