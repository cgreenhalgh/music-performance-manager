var app = require('express')();
var http = require('http').Server(app);
//var io = require('socket.io')(http);
var fs = require('fs');
//var dateFormat = require('dateformat');

app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({ extended: true })); 

// static files
app.get('/', function(req, res){
	console.log('get /');
	res.sendFile(__dirname + '/public/index.html');
});
function returnFile(req, res, root) {
	root = root!==undefined ? root : '/public';
	var url = require('url').parse(req.url);
	console.log('get ' + req.url + ' -> ' + root + url.pathname);
	res.sendFile(__dirname + root + url.pathname);
};
function returnPublicFile(req, res) {
	returnFile(req, res, '/public');
}
app.get('/*.(js|json|html)', returnPublicFile);
app.get('/vendor/*', returnPublicFile);
app.get('/css/*.css', returnPublicFile);
app.get('/js/*', returnPublicFile);
app.get('/partials/*', returnPublicFile);

app.get('/rdf/*', function(req, res) { returnFile(req, res, ''); });

http.listen(3003, function(){
	console.log('listening on *:3003');
});
