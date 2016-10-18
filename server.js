var app = require('express')();
var http = require('http').Server(app);
//var io = require('socket.io')(http);
var fs = require('fs');
//var dateFormat = require('dateformat');

// static files
app.get('/', function(req, res){
  console.log('get /');
  res.sendFile(__dirname + '/public/index.html');
});
function returnPublicFile(req, res) {
  var url = require('url').parse(req.url);
  console.log('get ' + req.url + ' -> ' + url.pathname);
  res.sendFile(__dirname + '/public' + url.pathname);
};
app.get('/vendor/*', returnPublicFile);
app.get('/css/*.css', returnPublicFile);
app.get('/js/*', returnPublicFile);
app.get('/partials/*', returnPublicFile);

http.listen(3000, function(){
	console.log('listening on *:3000');
});
