var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');
var dateFormat = require('dateformat');
var redis = require("redis");

// LOGGING STUFF...
var ROOT_DIR = path.join(__dirname,'..');

var LEVEL_DEBUG = 2;
var LEVEL_INFO = 4;
var LEVEL_WARN = 6;
var LEVEL_ERROR = 8;
var LEVEL_SEVERE = 10;

var LOG_FILENAME_DATE_FORMAT = "yyyymmdd'T'HHMMssl'Z'";
var LOG_DATE_FORMAT = "yyyy-mm-dd'T'HH:MM:ss.l'Z'";

var DEFAULT_TIMEOUT = 30000;
function run_process(cmd, args, cwd, timeout, cont) {
	console.log('spawn '+cmd+' '+args.join(' '));
	var output = [];
	var process = require('child_process').spawn(cmd,
			args, {
		cwd: cwd
	});
	process.stdin.on('error', function() {});
	process.stdout.on('data', function(data) {
		//console.log( 'Client stdout: '+data);
		output.push(data);
	});
	process.stdout.on('end', function() {});
	process.stdout.on('error', function() {});
	process.stderr.on('data', function(data) {
		output.push('Error: '+data);
	});
	process.stderr.on('end', function() {});
	process.stderr.on('error', function() {});
	process.on('close', function(code) {
		console.log('process '+cmd+' exited ('+code+')');
		cont(code, output.join(''));
	});
	console.log('done spawn');
}

var LOG_DIR = path.join(ROOT_DIR,'logs');
if (!fs.existsSync(LOG_DIR)) {
	console.log('Try to create log dir '+LOG_DIR);
	fs.mkdirSync(LOG_DIR);
	if (!fs.existsSync(LOG_DIR)) {
		console.log('ERROR: could not create log dir '+LOG_DIR);
	} else {
		console.log('Created log dir '+LOG_DIR);		
	}
}
var packageInfo = null;
try {
	var json = fs.readFileSync(path.join(ROOT_DIR,'package.json'),'utf8');
	packageInfo = JSON.parse(json);
}
catch (err) {
	console.log("Error reading/parsing package info from "+ROOT_DIR+'/package.json: '+err.message);
}
var appCommit = null;
run_process('git',['log','--pretty=format:%H','-1'], ROOT_DIR,DEFAULT_TIMEOUT,function(code,output) {
	if (code!==0) {
		console.log('Could not get git commit');
	} else {
		appCommit = output.trim();
		console.log('git commit = '+appCommit);
		// async
		log('server','git.commit', appCommit, LEVEL_INFO);
	}
});
var installId = null;
try {
	fs.accessSync(path.join(ROOT_DIR,'installId'), fs.R_OK);
	installId = fs.readFileSync(path.join(ROOT_DIR,'installId'),'utf8').trim();
} catch (err) {
	console.log('Error reading '+ROOT_DIR+'/installId: '+err.message);
}
if (installId===null) {
	var uuid = require('uuid');
	installId = uuid.v1();
	console.log('Generated installId '+installId);
	try {
		fs.writeFileSync(path.join(ROOT_DIR,'installId'), installId, 'utf8');
	} catch (err) {
		console.log('Error: could not write installId: '+err.message);
	}
}

var logPath=null;
var logFile=null;
{
	var now = new Date();
	logPath = path.join(LOG_DIR, dateFormat(now, LOG_FILENAME_DATE_FORMAT)+'.log');
	var info = {
		logVersion: '1.0'
	};
	if (packageInfo!==null) {
		info.application = packageInfo.name;
		info.version = packageInfo.version;
	} else {
		info.application = "mpm-server";
		// version ?!
	}
	// installId, machineNickname, appCommit
	if (appCommit!==null)
		info.appCommit = appCommit;
	if (installId!==null)
		info.installId = installId;

	try {
		console.log('create log file '+logPath);
		logFile = fs.createWriteStream(logPath, {flags:'a+',defaultEncoding:'utf8',autoClose:true,mode:0o644});
	} catch (err) {
		console.log('Error creating log file '+logPath+': '+err.message);
	}
}
function log(component, event, info, level) {
	if (logFile!==null) {
		if (level===undefined)
			level = LEVEL_INFO;
		var now = new Date();
		var entry = {
				time: now.getTime(),
				datetime: dateFormat(now, LOG_DATE_FORMAT),
				level: level,
				component: component,
				event: event,
				info: info
		};
		logFile.write(JSON.stringify(entry));
		logFile.write('\n');
	} else {
		console.log('no log: component='+component+' event='+event+' info='+JSON.stringify(info)+' level='+level)
	}
}
log('server', 'log.start', info, LEVEL_INFO);

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
	log('server','mpm-report',msg,LEVEL_INFO);
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
	socket.on('mpm-report', function(msg) {
		handleReport(msg, socket.request.connection.remoteAddress);
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
		io.to(room).emit('monitorTestPointValue', msg);
	});
	socket.on('setTestPoint', function(msg) {
		// {iri, id, value}
		var room = msg.iri+'/'+msg.id;
		console.log('setTestPoint', msg);
		log('server','setTestPoint', msg, LEVEL_INFO);
		io.to(room).emit('setTestPoint', msg);
	});
	socket.emit('hello', {server:'mpm-server',version:'0.1'});
	socket.join(MONITOR_ROOM);
}
Client.prototype.disconnect = function() {
	console.log('client disconnected');
}
io.on('connection', function(socket){
	new Client(socket);
});

http.listen(3003, function(){
	console.log('listening on *:3003');
	log('server','http.listen',{port:3003},LEVEL_INFO);
});
