/* main ... */
console.log('dashboard...');

var module = angular.module('mpm-dashboard', ['mpm-rdf', 'muzicodes.logging', 'muzicodes.socket', 'mpm-agent']);

module.controller('DashboardController', ['$scope','socket','mpmAgent','$interval',
                                     function($scope,  socket,  mpmAgent,  $interval) {
	console.log('DashboardController');
	mpmAgent.init({name:'mpm-dashboard'});
	socket.on('hello', function(msg) {
		console.log('received hello: ', msg);
	});
	socket.emit('hello',{client:'mpm-dashboard',version:'0.1'});
	
	$scope.processes = {}; //{ test: {info:{name:'text'}} };
	
	// local expire
	$interval(function() {
		var now = (new Date()).getTime();
		for (var pi in $scope.processes) {
			var process = $scope.processes[pi];
			console.log('process '+pi+' expires at '+process.expiresAt+' in '+(process.expiresAt-now));
			if (process.expiresAt && process.expiresAt <= now) {
				console.log('expire process '+pi);
				delete $scope.processes[pi];
			}
		}
	}, 3000);
	
	// initial subscribe
	socket.emit('subscribe', 'mpm');
	socket.on('reconnect', function(msg) {
		console.log('reconnected');
		socket.emit('subscribe', 'mpm');
	});
	socket.on('subscribed', function(msg) {
		console.log('subscribed to '+msg);
	});
	
	function handleReport(msg) {
		var now = (new Date()).getTime();
		if (msg.expire) {
			msg.expiresAt = now+1000*msg.expire;
		} else {
			console.log('Warning: no expire in report', msg);
		}
		if (msg['@type']=='Process' && !!msg['@id']) {
			$scope.processes[msg['@id']] = msg;
		} else {
			console.log('unhandled report', msg);
		}
	}
	
	socket.on('mpm-report', function(msg) {
		//console.log('mpm-report', msg);
		handleReport(msg);
	});
	socket.on('mpm-report.old', function(msg) {
		//console.log('mpm-report.old', msg);
		handleReport(msg);
	});
}]);

module.filter('date', function() {
	  return function(ms) {
		  return new Date(ms).toISOString();
	  }
});