var      http = require('http'),
          url = require('url'),
           fs = require('fs'),
  serveAssets = require('./serve-assets.js'),
requestHandler = require('./request-handler.js');

var port = 8080;
var ip = '127.0.0.1';

var routes = {
  '/': requestHandler.requestHandler,
  '/bower_components/underscore/underscore-min.js': serveAssets.serveStatic,
  '/bower_components/jquery/dist/jquery.min.js': serveAssets.serveStatic,
  '/bower_components/underscore/underscore-min.map': serveAssets.serveStatic,
  '/bower_components/jquery/dist/jquery.min.map': serveAssets.serveStatic,
  '/server/app.js': serveAssets.serveStatic,
  '/entry': requestHandler.requestHandler,
  '/entries': serveAssets.serveStatic,
  '/styles/app.css': serveAssets.serveStatic,
  '/deleteEntries': requestHandler.requestHandler
};

var server = http.createServer(function(request, response){
  var parts = url.parse(request.url);
  var route = routes[parts.pathname];
  // console.log("This is parts inside server: ", parts.pathname);
  // console.log("This is Route: ", route);
  // console.log("This is asset paths ", serveAssets.assets);

  console.log("This is the method: ", request.method, " for route ", parts.pathname);

  if(route){
    route(request, response);
  } else {
    requestHandler.sendResponse(response, "NOT FOUND", 404);
  }
});

console.log("Listening on http://" + ip + ":" + port);
server.listen(port, ip);

