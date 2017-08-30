var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');
var dateFormat = require('dateformat');
var redis = require("redis");
var logging = require("./logging");
var loguse = require("./loguse");
var request = require('request');

logging.init('server', 'mpm-server');

// SERVER...

//MPM agent - default
var mpmAgent = require('./mpm-agent');

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
var TEMPLATES_DIR = rootdir+'/templates/';
app.get('/templates/', function(req,res) {
	console.log('get templates');
	fs.readdir(TEMPLATES_DIR, function(err,fnames) {
		if (err) {
			res.status(500).send('Could not read templates directory ('+err+')');
			return;
		}
		var resp = {templates:[]};
		for (var ni in fnames) {
			var fname = fnames[ni];
			var m = /^(.*\.json)$/.exec(fname);
			if (m!==null) {
				var name = m[1];
				resp.templates.push ( template = {name:name} );
				try {
					var info = fs.statSync(TEMPLATES_DIR+name);
					template.lastmodified = info.mtime.getTime();
				} catch (err) {
					console.log('Error stat '+name+': '+err);
				}
			}
		}
		res.set('Content-Type', 'application/json').send(JSON.stringify(resp));
	});
});
app.get('/templates/:template', function(req,res) {
	console.log('get template '+req.params.template);
	res.sendFile(TEMPLATES_DIR+req.params.template);
});

app.get('/*.(js|json|html)', returnPublicFile);
app.get('/vendor/*', returnPublicFile);
app.get('/css/*.css', returnPublicFile);
app.get('/js/*', returnPublicFile);
app.get('/partials/*', returnPublicFile);

app.get('/rdf/*', function(req, res) { returnFile(req, res, ''); });

// Redis
var redisClient = redis.createClient();
redisClient.on('ready', function() {
	console.log('redis client ready');
})
redisClient.on('reconnecting', function() {
	console.log('Warning: redis client reconnecting');
})
redisClient.on("error", function (err) {
    console.log("Error with Redis: " + err);
});
 

var DEFAULT_REPORT_EXPIRE = 30;
var MPM_ROOM = 'mpm';
var MONITOR_ROOM = 'mpm-monitor';
var MPM_TYPES = ['Process:','Environment'];

function handleReport(msg, clientIp) {
	var expire = msg.expire = msg.expire || DEFAULT_REPORT_EXPIRE;
	var id = msg['@id'];
	if (!id) {
		console.log('Error: mpm-report without @id: ', msg);
		return false;
	}
	msg.clientIp = clientIp;
	var type = msg['@type'];
	if (!type) {
		console.log('Error: mpm-report without @type: ', msg);
		return false;
	}
	// post to redis
	var key = type+':'+id;
	console.log('received mpm-report for '+key);
	logging.log('server','mpm-report',msg,logging.LEVEL_INFO);
	redisClient.setex(key, expire, JSON.stringify(msg));
	// update socket.io subscribers?
	io.to(MPM_ROOM).emit('mpm-report', msg);
	return true;
}

app.post('/api/1/mpm-report', function(req,res) {
	if (req.body===null || typeof req.body != 'object') {
		res.status(400).send('request body was not a JSON object: '+req.data);
		return;
	}
	if (!handleReport(req.body)) {
		res.status(400).send('mpm-report was not well-formed');
		return;
	}
	res.status(200).send({ok:true});
});

app.post('/api/1/testPost', function(req,res) {
	console.log('testPost request', req.headers);
	req.on('data', function(data) {
		console.log('testPost '+data.length+' bytes');
	}).on('end', function() {
		console.log('testPost complete');
		res.status(200).send({ok:true});		
	});
});

function HttpProbe(msg) {
	console.log('create HTTP Probe', msg);
	var self = this;
	this.id = msg['@id'];
	this.title = msg.title;
	this.config = msg.config;
	this.period = this.config.period | 5;
	this.timeout = this.config.timeout | 5;
	this.probeInterval = setInterval(function() { self.probe(); }, this.period*1000);
	setTimeout(function() { self.sendReport(); }, 1000);
	setTimeout(function() { self.probe(); }, 2000);
	this.reportInterval = setInterval(function() {
		self.sendReport();
	}, 1000*DEFAULT_REPORT_EXPIRE/2);
	this.sendReport();
}
HttpProbe.prototype.probe = function() {
	var self = this;
	console.log('probe '+self.config.url+' with timeout '+self.config.timeout);
	// TODO
	var room = self.id+'/'+'status';
	var msg =  {iri: self.id, id: 'status', value: 'internal error'};
	try {
		console.log('POST to '+self.config.url);
		request.post({url: self.config.url, timeout: self.timeout*1000})
		.on('response', function(httpResp ) {
			console.log('POST response '+httpResp.statusCode+' ('+httpResp.statusMessage+')');
			msg.value = String(httpResp.statusCode);
			io.to(room).emit('monitorTestPointValue', msg);
		})
		.on('error', function(err) {
			console.log('POST error', err);
			msg.value = 'error ('+err.message+')';
			io.to(room).emit('monitorTestPointValue', msg);
		});
	}
	catch (err) {
		console.log('POST exception', err);
		msg.value = 'error ('+err.message+')';
		io.to(room).emit('monitorTestPointValue', msg);
	}
};
HttpProbe.prototype.destroy = function() {
	console.log('destroy probe '+this.id);
	clearInterval(this.probeInterval);
	clearInterval(this.reportInterval);
}
HttpProbe.prototype.sendReport = function() {
	var msg = {
		'@id': this.id,
		'title': this.title,
		'probeType': 'HTTP',
		'@type': 'Probe',
		'datetime': (new Date()).toISOString(),
		'testPoints': [ 
			{
				'name': 'status',
				'read': true,
				'write': false,
				'monitor': true
			}
		]
	};
	handleReport(msg, '127.0.0.1');
}
// Socket.io
function Client(socket) {
	this.socket = socket;
	console.log('New client');
	loguse.addClient(socket);
	var self = this;
	socket.on('disconnect', function(){
		self.disconnect();
	});
	socket.on('hello', function(msg) {
		console.log('received hello: ', msg);
	});
	socket.on('mpm-report', function(msg) {
		handleReport(msg, socket.request.connection.remoteAddress);
		// general message
		//var room = msg['@id']+'/General';
		//socket.join(room);
		// test...
		//console.log('on report join general channel '+room);
		//io.to(room).emit('alert', 'join '+room+' on mpm-report');
		//socket.emit('alert', 'on mpm-report');
		// testPoints
		if (msg.testPoints) {
			for (var p in msg.testPoints) {
				var point = msg.testPoints[p];
				if (point.write) {
					var room = msg['@id']+'/'+p;
					socket.join(room);
				}
			}
		}
		if (msg.files) {
			var room = msg['@id']+'/Files';
			socket.join(room);
		}
	});
	socket.on('subscribe', function(msg) {
		console.log('Client subscribe '+msg);
		socket.join(msg);
		// send current state(s)
		socket.emit('subscribed', msg);
		for (var ti in MPM_TYPES) {
			var type = MPM_TYPES[ti];
			redisClient.keys(type+'*', function(err, keys) {
				for (var ki in keys) {
					var key = keys[ki];
					// can you do this?
					var report = redisClient.get(key, function(err, value) {
						socket.emit('mpm-report.old', JSON.parse(value));
					});
				}
			});
		}
	});
	socket.on('monitorTestPoint', function(msg) {
		// {iri,id,monitor}
		var room = msg.iri+'/'+msg.id;
		if (msg.monitor) {
			console.log('client monitor '+room);
			socket.join(room);
		} else {
			console.log('client unmonitor '+room);
			socket.leave(room);
		}
		io.to(MONITOR_ROOM).emit('monitorTestPoint', msg);
	});
	socket.on('monitorTestPointValue', function(msg) {
		// {iri, id, value}
		var room = msg.iri+'/'+msg.id;
		console.log('monitorTestPointValue', msg);
		logging.log('server','monitorTestPointValue',msg,logging.LEVEL_INFO);
		io.to(room).emit('monitorTestPointValue', msg);
	});
	socket.on('setTestPoint', function(msg) {
		// {iri, id, value}
		var room = msg.iri+'/'+msg.id;
		console.log('setTestPoint', msg);
		logging.log('server','setTestPoint', msg, logging.LEVEL_INFO);
		io.to(room).emit('setTestPoint', msg);
	});
	socket.on('post', function(msg) {
		// iri, path, url, request
		var room = msg.iri+'/Files';
		console.log('post', msg);
		socket.join(msg.request+'/PostRequest');
		logging.log('server', 'post', msg, logging.LEVEL_INFO);
		io.to(room).emit('post', msg);
	});
	socket.on('postResponse', function(msg) {
		// iri, path, url, request, status?, length?
		var room = msg.request+'/PostRequest';
		console.log('postResponse', msg);
		logging.log('server', 'postResponse', msg, logging.LEVEL_INFO);
		io.to(room).emit('postResponse', msg);
	});
	self.probes = [];
	socket.on('createProbe', function(msg) {
		if('HTTP'==msg.probeType) {
			var probe = new HttpProbe(msg);
			self.probes.push(probe);
		}
		else {
			console.log('unknown probe type: '+msg.probeType);
		}
	});
	socket.emit('hello', {server:'mpm-server',version:'0.1'});
	socket.join(MONITOR_ROOM);
}
Client.prototype.disconnect = function() {
	console.log('client disconnected');
	// destroy client-specific probes
	for (var pi in this.probes) {
		var probe = this.probes[pi];
		probe.destroy();
	}
}
io.on('connection', function(socket){
	new Client(socket);
});

http.listen(3003, function(){
	console.log('listening on *:3003');
	logging.log('server','http.listen',{port:3003},logging.LEVEL_INFO);
});
