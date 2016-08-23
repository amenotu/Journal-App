var fs = require("fs");
var path = require("path");
var url = require("url");

var headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10, // Seconds.
};

exports.assets = {
  siteAssets: path.join(__dirname + '/../client/public'),
  dependencies: path.join(__dirname + '/../client'),
  journalEntries: path.join(__dirname + '/../journal_entries'),
  app: path.join(__dirname)
};

// var routeContains = function(name, route){
//   console.log(route);
//   var found = false;
//   var directories = route.split('/');
//   console.log("this is directories: ", directories);
//   directories.forEach(function(directoryName){
//     if(directoryName === name){
//       found = true;
//     }
//   });
//   return found;
// };

var sendResponse = function(response, data, status){
  var status = status || 200;
  response.writeHead(status, headers);
  response.end(data);
};

var serveAssets = function(response, asset){
  var encoding = {encoding: 'utf8'};

  fs.readFile(asset, encoding, function(err, data){
    if(err){
      console.log("There was an error serving the asset: ", asset);
    } else {
      sendResponse(response, data);
    }
  });
};

exports.serveStatic = function(request, response){
  var filePath = url.parse(request.url).pathname;
  console.log('Currently getting file: ', filePath);

  if(filePath === '/'){
    //serve index.html
    serveAssets(response, exports.assets.siteAssets + '/index.html');
  } else if(filePath === '/server/app.js'){
    //serve app.js
    serveAssets(response, exports.assets.app + '/app.js');
  } else if(filePath === '/entries'){
    //read the journal_entries.txt file and respond with the data
    fs.readFile(exports.assets.journalEntries + '/entries.txt', function(err, data){
      if(err){
        console.log("There was an error serving the asset: ", asset);
      } else {
        response.writeHead(200, {"Content-Type": "application/json"});
        response.end(JSON.stringify(data.toString('utf8')));
      }
    });
  } else {
    //serve everything else like dependencies, etc...
    serveAssets(response, exports.assets.dependencies + filePath);
  }
};