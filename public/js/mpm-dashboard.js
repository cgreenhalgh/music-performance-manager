/* main ... */
console.log('dashboard...');

var module = angular.module('mpm-dashboard', ['mpm-rdf', 'muzicodes.logging', 'muzicodes.socket', 'mpm-agent']);

module.controller('DashboardController', ['$scope','socket','mpmAgent','$interval','$timeout',
                                     function($scope,  socket,  mpmAgent,  $interval,  $timeout) {
	console.log('DashboardController');
	mpmAgent.init({name:'mpm-dashboard'});
	socket.on('hello', function(msg) {
		console.log('received hello: ', msg);
	});
	socket.emit('hello',{client:'mpm-dashboard',version:'0.1'});
	
	$scope.processes = {}; //{ test: {info:{name:'text'}} };
	$scope.environments = {}; //{ test: {info:{name:'text'}} };
	$scope.selected = null;
	
	function expire(reports) {
		var now = (new Date()).getTime();
		for (var pi in reports) {
			var process = reports[pi];
			console.log('process '+pi+' expires at '+process.expiresAt+' in '+(process.expiresAt-now));
			if (process.expiresAt && process.expiresAt <= now) {
				console.log('expire process '+pi);
				delete reports[pi];
			}
		}		
	}
	// local expire
	$interval(function() {
		expire($scope.processes);
		expire($scope.environments);
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
		} else if (msg['@type']=='Environment' && !!msg['@id']) {
			$scope.environments[msg['@id']] = msg;
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
	
	$scope.showMore = function(type, id, value) {
		console.log('showMore('+type+','+id+'): '+JSON.stringify(value));
		$scope.selected = value;
		$timeout(function () {
			var divPosition = $('#selected').offset();
			$('html, body').animate({scrollTop: divPosition.top}, "slow");			
		}, 0);
	};
	$scope.clearSelected = function() {
		$scope.selected = null;
	}
}]);

module.filter('date', function() {
	  return function(ms) {
		  return new Date(ms).toISOString();
	  }
});