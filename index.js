var connect = require('connect');
var modRewrite = require('connect-modrewrite');
var serveStatic = require('serve-static');
var compression = require('compression');
var fs = require('fs');
var app = connect();

module.exports = {
  _port: 9000,
  _directory: 'public',

  port: function (port) {
    this._port = port;
  },

  directory: function (dir) {
    this._directory = dir;
  },

  start: function (options) {
    options = options || {};

    var port = process.env.PORT || options.port || this._port;
    var directory = options.directory || this._directory;
    var directories = options.directories || [directory];

    app.use(function logger(req, res, next) {
      console.log(req.method, req.url);

      next();
    });

    app.use(function blocker(req, res, next) {
      var blockFile = directory + '/.block';

      fs.exists(blockFile, function(exists) {
        if(!exists) {
          next();
        } else {
          console.log("BLOCKING...");
          fs.watch(blockFile, function(event) {
            if(event === "rename") {
              next();
            }
          });
        }
      });
    });

    app.use(modRewrite([
      '!\\.html|\\.js|\\.json|\\.ico|\\.csv|\\.css|\\.png|\\.svg|\\.eot|\\.ttf|\\.woff|\\.appcache|\\.jpg|\\.jpeg|\\.gif /index.html [L]'
    ]));
    app.use(compression());

    directories.forEach(function(directory) {
      app.use(serveStatic(directory));
    });

    app.listen(port, function () {
      console.log('\nPushstate server started on port ' + port + '\n');
    });
  }
};
