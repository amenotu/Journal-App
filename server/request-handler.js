var fs = require('fs');
var serveAssets = require('./serve-assets.js');

var headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10, // Seconds.
  'Content-Type': "application/json"
};

var entries = [];

exports.sendResponse = function(response, data, statusCode){
  var statusCode = statusCode || 200;
  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(data));
};

exports.sendRedirect = function(response, location, status){
  status = status || 302;
  response.writeHead(status, {Location: location});
  response.end();
};

var collectData = function(request, callback){
  var body = '';
  request.on('data', function(chunk){
    body += chunk.toString('utf8');
  });
  request.on('end', function(){
    var data = body.split('&');
    var parsed = [];

    data.forEach(function(element){
      var text = element.replace(/^(.*?)=/gi, '');
      parsed.push(decodeURIComponent(text));
    });

    var entryObj = {
      date: parsed[0],
      topic: parsed[1],
      text: parsed[2]
    };
    callback(entryObj);
  });
};

var contains = function(entriesCollection, targetEntry){
  var found = false;
  entriesCollection.forEach(function(entry){
    if(entry.date === targetEntry.date && entry.topic === targetEntry.topic && entry.text === targetEntry.text){
      found = true;
    }
  });
  return found;
};

var actions = {
  "GET": function(request, response){
    serveAssets.serveStatic(request, response);
  },
  "POST": function(request, response){
    collectData(request, function(entry){
      var journalEntryStore = __dirname + '/../journal_entries/entries.txt';
      var stringifiedEntry = JSON.stringify(entry);
      // console.log("ENTRY INSIDE POST: ", entry);
      entries.push(entry);
      fs.appendFile(journalEntryStore, stringifiedEntry + ',\n', function(err, file){
        if(!err){
          exports.sendResponse(response, 201);
        } else {
          console.log("There was an error appending file: ", err);
        }
      })
    });
  },
  "DELETE": function(request, response){
    collectData(request, function(entry){
      fs.readFile(serveAssets.assets.journalEntries + '/entries.txt', function(err, data){
        if(!err){
          var temp = entry.text;
          entry.text = entry.text.replace(/[\n]/g, '\r\n');
          var entryStr = JSON.stringify(entry);
          var arrayOfExistingEntries = data.toString().split(',\n');

          if(contains(arrayOfExistingEntries, entryStr)){
            arrayOfExistingEntries.forEach(function(currentEntry, index){
              if(currentEntry === entryStr){
                arrayOfExistingEntries.splice(index,1);
              }
            });

            var dataToWrite = arrayOfExistingEntries.join(',\n');
            fs.writeFile(serveAssets.assets.journalEntries + '/entries.txt', dataToWrite, 'utf8', function(err){
              if(!err){
                exports.sendResponse(response, 200);
              } else {
                console.log("There was an error deleting the file: ", err);
              }
            });
          } else {
            console.log("Entry not found");
          }
        } else {
          console.log("There was an error reading file: ", err);
        }
      })
    })
  }
}


exports.requestHandler = function(request, response) {
  console.log("Serving request type " + request.method + " for url " + request.url);
  
  var action = actions[request.method];

  if(action){
    action(request, response);
  } else {
    exports.sendResponse(response, "FILE NOT FOUND", 404);
  }
};
