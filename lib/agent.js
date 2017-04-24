// Node Agent
console.log('Node status service agent');

var os = require('os');
//if (!os.tmpdir)
var osTmpdir = require('os-tmpdir');
var path = require('path');
var fs = require('fs');
var uuid = require('uuid/v1'); // MAC/timestamp based

function datetime() {
	return (new Date()).toISOString();
}

// (probably) fixed OS-related information
function getOsInfo() {
	var info = {
		datetime: datetime(),
		arch: os.arch(),
		cpus: os.cpus(),
		hostname: os.hostname(),
		networkInterfaces: os.networkInterfaces(),
		platform: os.platform(),
		release: os.release(),
		type: os.type(),
		totalmem: os.totalmem()
	};
	return info;
}

// dynamic OS-related information
function getOsStatus() {
	var status = {
		datetime: datetime(),
		uptime: os.uptime(),
		loadavg: os.loadavg(),
		freemem: os.freemem()
	};
	return status;
}

function getProcessInfo() {
	return {
		pid: process.pid,
		end: process.env,
		argv: process.argv,
		execArgv: process.execArgv,
		execPath: process.execPath,
		nodeVersion: process.version
	}
}
function getProcessStatus() {
	return {
		//cpuUsage: process.cpuUsage(),
		cwd: process.cwd(),
		memoryUsage: process.memoryUsage(),
		uptime: process.uptime()
	}
}

function getUuidIri() {
	return 'urn:uuid:'+uuid();
}

var os = {
		info: getOsInfo(),
		status: getOsStatus()
};

console.log(JSON.stringify(os,null,2));

var proc = {
		info: getProcessInfo(),
		status: getProcessStatus()
};
console.log(JSON.stringify(proc, null, 2));

var tmpdir = osTmpdir();

var ENVIRONMENT_FILENAME = 'music-perf-mgr-env.json';
var environment_file = path.join(tmpdir,ENVIRONMENT_FILENAME);
var environment=null;
console.log('check environment file '+environment_file);

try {
	var data = fs.readFileSync(environment_file, 'utf-8');
	console.log('read '+data);
	environment = JSON.parse(data);
	console.log('Read environment '+JSON.stringify(environment, null, 2));
}
catch (err) {
	console.log('Error reading environment file '+environment_file+': '+err.message);
}
if (!environment || !environment['@id']) {
	var envid = getUuidIri();
	environment = {
			'@id': envid
	};
	console.log('Generating environment: '+JSON.stringify(environment, null, 2));
	try {
		fs.writeFileSync(environment_file, JSON.stringify(environment), {encoding:'utf8', flag:'wx'});
		console.log('Wrote environment file '+environment_file);
	} catch (err) {
		console.log('Error writing environment file '+environment_file+': '+err.message);
	}
}
