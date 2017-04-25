var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');
//var dateFormat = require('dateformat');

app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({ extended: true })); 

var rootdir = path.dirname( __dirname );

// static files
app.get('/', function(req, res){
	console.log('get /');
	res.sendFile(rootdir + '/public/index.html');
});
function returnFile(req, res, root) {
	root = root!==undefined ? root : '/public';
	var url = require('url').parse(req.url);
	console.log('get ' + req.url + ' -> ' + root + url.pathname);
	res.sendFile(rootdir + root + url.pathname);
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

// TODO: internal agent

// Socket.io
function Client(socket) {
	this.socket = socket;
	console.log('New client');
	var self = this;
	socket.on('disconnect', function(){
		self.disconnect();
	});
	socket.on('hello', function(msg) {
		console.log('received hello: ', msg);
	});
	socket.emit('hello', {server:'mpm-server',version:'0.1'});
}
Client.prototype.disconnect = function() {
	console.log('client disconnected');
}
io.on('connection', function(socket){
	new Client(socket);
});

http.listen(3003, function(){
	console.log('listening on *:3003');
});
