/* main ... */
console.log('dashboard...');

var module = angular.module('mpm-dashboard', ['mpm-rdf', 'muzicodes.logging', 'muzicodes.socket', 'mpm-agent']);

module.controller('DashboardController', ['$scope','socket','mpmAgent','$interval','$timeout', '$http',
                                     function($scope,  socket,  mpmAgent,  $interval,  $timeout, $http) {
	console.log('DashboardController');
	mpmAgent.init({name:'mpm-dashboard'});
	socket.on('hello', function(msg) {
		console.log('received hello: ', msg);
	});
	socket.emit('hello',{client:'mpm-dashboard',version:'0.1'});
	
	$scope.processes = {}; //{ test: {info:{name:'text'}} };
	$scope.environments = {}; //{ test: {info:{name:'text'}} };
	$scope.selected = null;
	$scope.templates = [];
	$scope.templateName = "";
	$scope.template = {};
	$scope.expected = [];
	$scope.selectedTestPoint = {id:'', value: ''};
	
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
		checkExpected();
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
		checkExpected();
	}
	
	socket.on('mpm-report', function(msg) {
		//console.log('mpm-report', msg);
		handleReport(msg);
	});
	socket.on('mpm-report.old', function(msg) {
		//console.log('mpm-report.old', msg);
		handleReport(msg);
	});
	
	socket.on('monitorTestPointValue', function(msg) {
		console.log('monitorTestPointValue', msg);
		// TODO
		if (msg.iri==$scope.selected['@id'] && msg.id==$scope.selectedTestPoint.id) {
			$scope.selectedTestPoint.value = JSON.stringify(msg.value);
		} else {
			console.log('ignore monitorTestPointValue '+msg.iri+' '+msg.id);
		}
	});
	$scope.showMore = function(type, id, value) {
		console.log('showMore('+type+','+id+'): '+JSON.stringify(value));
		$scope.selected = value;
		$scope.selectedTestPoint.id = '';
		$scope.selectedTestPoint.value = '';
		$timeout(function () {
			var divPosition = $('#selected').offset();
			$('html, body').animate({scrollTop: divPosition.top}, "slow");			
		}, 0);
	};
	$scope.clearSelected = function() {
		if ($scope.selectedTestPoint.id && $scope.selected) {
			monitor($scope.selected['@id'], $scope.selectedTestPoint.id, false);
		}
		$scope.selected = null;
	}
	function monitor(iri, id, monitor) {
		console.log('monitorTestPoint '+iri+' '+id+': '+monitor+' (from '+mpmAgent.getIri()+')');
		socket.emit('monitorTestPoint', {iri: iri, id: id, request: mpmAgent.getIri(), monitor: monitor});
	}
	$scope.$watch('selectedTestPoint.id', function(name, oldValue) {
		console.log('watch test point '+name);
		if ($scope.selected) {
			if (!name && !!oldValue) {
				monitor($scope.selected['@id'], oldValue, false);
			}
			if (name) {
				monitor($scope.selected['@id'], name, true);
			}
		}
	});
	$scope.loadTemplate = function() {
		var name = $scope.templateName;
		console.log('load template '+name);
		// TODO
		$http.get('/templates/'+name).then(function(res) {
			console.log('loaded template '+name+': '+JSON.stringify(res.data));
			$scope.template = res.data;
			var expected = [];
			for (var ei in $scope.template.expect) {
				var expect = $scope.template.expect[ei];
				expected.push({ matched:false, expect: expect });
			}
			console.log('expect '+expected.length);
			$scope.expected = expected;
			checkExpected();
		}, function(err) {
			var msg = 'Error loading template '+name+' ('+err.message+')';
			console.log(msg);
			alert(msg);
		});
	}
	
	$http.get('/templates/').then(function(res) {
		var data = res.data;
		console.log('got '+data.templates.length+' templates');
		$scope.templates = data.templates;
	}, function(err) {
		var msg = 'Error getting templates ('+err.message+')';
		console.log(msg);
		alert(msg);
	});
	
	function matches(pattern, value) {
		if (pattern == value) {
			console.log('matches, ==, '+pattern+', '+value);
			return true;
		}
		if (typeof(pattern)=='object') {
			for (var fname in pattern) {
				var fvalue = pattern[fname];
				console.log('matches, object, field '+fname+'='+fvalue+' vs '+value[fname]);
				if (value[fname]===undefined) {
					console.log('matches, object, field '+fname+' undefined in '+value);
					return false;
				}
				if (!matches(fvalue, value[fname])) {
					return false;
				}
			}
			console.log('matches, object, true, '+pattern+', '+value);
			return true;
		}
		console.log('matches, not equal and not object, '+pattern+', '+value);
		return false;
	};
	function checkExpected() {
		console.log('check expected ('+$scope.expected.length+')');
		// reset?
		var required = {};
		for (var ei in $scope.expected) {
			var expected = $scope.expected[ei];
			expected.matched = false;
			expected.tooMany = false;
			expected.matches = [];
			expected.hide = false;
			expected.status = '';
			if (!!expected.expect.requires && expected.expect.requires.length>0) {
				var requiredOk = true;
				for (var ri in expected.expect.requires) {
					var requires = expected.expect.requires[ri];
					if (required[requires]===undefined) {
						console.log('requires '+requires+' unsatisfied for '+expected);
						requiredOk = false;
						break;
					}
				}
				if (!requiredOk) {
					expected.hide = true;
					continue;
				}
				// TODO multiple matches, multiple requires
				var report = required[expected.expect.requires[0]].matches[0];
				console.log('check expected with requires '+JSON.stringify(expected)+' vs '+JSON.stringify(report));
				if (matches(expected.expect.like, report)) {
					expected.matched = true;
					expected.matches.push( report );
				}
			}
			else if ('Report'==expected.expect.kind && !!expected.expect.like) {
				console.log('check expected Report '+expected);
				for (var pi in $scope.processes) {
					var report = $scope.processes[pi];
					if(matches(expected.expect.like, report)) {
						expected.matched = true;
						expected.matches.push( report );
					} 
				}
			} else if (!expected.expect.like) {
				console.log('ignored expected withouth like: '+expected);
			} else {
				console.log('unhandled expected kind '+expected.expect.kind+' ('+expected+')');
			}
			if (!!expected.expect.maxCardinality && expected.matches.length>expected.expect.maxCardinality) {
				console.log('too many matches for '+expected);
				expected.tooMany = true;
				expected.status = expected.expect.level;
			} else if (!expected.matched) {
				expected.status = expected.expect.level;
			}
			if (!!expected.expect.id && expected.matched && !expected.tooMany) {
				required[expected.expect.id] = expected;
			}
		}
	};
	$scope.setTestPointValue = function() {
		console.log('set test point value to '+$scope.selectedTestPoint.value);
		if ($scope.selectedTestPoint.id && $scope.selected) {
			socket.emit('setTestPoint', {iri: $scope.selected['@id'], id: $scope.selectedTestPoint.id, request: mpmAgent.getIri(), value: JSON.parse($scope.selectedTestPoint.value)});
		}

	}
}]);

module.filter('date', function() {
	  return function(ms) {
		  return new Date(ms).toISOString();
	  }
});