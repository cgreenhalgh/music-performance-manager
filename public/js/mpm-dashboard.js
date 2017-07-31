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
	$scope.monitoredTestPoints = {};
	$scope.variables = {'ip':{value:'127.0.0.1'}};
	
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
		if ($scope.selected && msg.iri==$scope.selected['@id'] && msg.id==$scope.selectedTestPoint.id) {
			$scope.selectedTestPoint.value = JSON.stringify(msg.value);
		} else {
			//console.log('ignore monitorTestPointValue '+msg.iri+' '+msg.id);
		}
		var point = msg.iri+'/'+msg.id;
		if ($scope.monitoredTestPoints[point]!==undefined) {
			$scope.monitoredTestPoints[point].value = msg.value;
			console.log('update to monitor value '+point);
			checkExpected();
		}
	});
	socket.on('postResponse', function(msg) {
		var text = 'POST response: '+msg.status;
		console.log(text, msg);
		alert(text);
	});
	socket.on('alert', function(msg) {
		console.log('alert', msg);
	});
	$scope.showExpected = function(expected) {
		var report = expected.matches[0];
		$scope.showMore(report['@type'], report['@id'], report)
	};
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
	function replaceVariables(data) {
		if (typeof(data)=='object') {
			for (var key in data) {
				var value = data[key];
				if (typeof(value)=='string') {
					for (var name in $scope.variables) {
						if (value=='{{'+name+'}}') {
							value =  $scope.variables[name].value;
							break;
						}
						value = value.replace(RegExp('\{\{'+name+'\}\}', 'g'), $scope.variables[name].value);
					}
					data[key] = value;
				} else {
					replaceVariables(value);
				}
			}
		}
	}
	$scope.loadTemplate = function() {
		var name = $scope.templateName;
		console.log('load template '+name);
		// TODO
		$http.get('/templates/'+name).then(function(res) {
			console.log('loaded template '+name+': '+JSON.stringify(res.data));
			replaceVariables(res.data);
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
		var debug = false;
		if (pattern===undefined)
			// auto-match
			return true;
		if (pattern == value) {
			if (debug) console.log('matches, ==, '+pattern+', '+value);
			return true;
		}
		if (typeof(pattern)=='object') {
			for (var fname in pattern) {
				var fvalue = pattern[fname];
				if (debug) console.log('matches, object, field '+fname+'='+fvalue+' vs '+value[fname]);
				if (value[fname]===undefined) {
					if (debug) console.log('matches, object, field '+fname+' undefined in '+value);
					return false;
				}
				if (!matches(fvalue, value[fname])) {
					return false;
				}
			}
			if (debug) console.log('matches, object, true, '+pattern+', '+value);
			return true;
		}
		if (debug) console.log('matches, not equal and not object, '+pattern+', '+value);
		return false;
	};
	function checkExpected() {
		var debug = false;
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
			expected.showValue = null;
			expected.required = null;
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
				expected.required = report;
				if (debug) console.log('check expected with requires '+JSON.stringify(expected)+' vs '+JSON.stringify(report));
				if ('Report'==expected.expect.kind && !!expected.expect.like) {
					if (matches(expected.expect.like, report)) {
						expected.matched = true;
						expected.matches.push( report );
					}
				} else if ('TestPoint'==expected.expect.kind && expected.expect.testPoint) {
					// monitor...
					var point = report['@id']+'/'+expected.expect.testPoint;
					if ($scope.monitoredTestPoints[point]===undefined) {
						console.log('monitor '+point);
						$scope.monitoredTestPoints[point] = {};
						monitor(report['@id'], expected.expect.testPoint, true);
					} else if (matches(expected.expect.like, $scope.monitoredTestPoints[point].value)) {
						expected.matched = true;
						expected.matches.push( $scope.monitoredTestPoints[point].value );
						if (expected.expect.show)
							expected.showValue = $scope.monitoredTestPoints[point].value;
					}
				} else if ('File'==expected.expect.kind && expected.expect.fileTag && !!report.files) {
					var file = report.files.filter(function(f){ return f.tag==expected.expect.fileTag; })
						.sort(function(a,b){ return a.created==null ? 1 : -a.created.localeCompare(b.created); })
						.find(function() { return true; });
					if (file!==undefined) {
						expected.matched = true;
						expected.matches.push( file );
						if (expected.expect.show)
							expected.showValue = file.path;
					}
				}
			}
			else if ('Report'==expected.expect.kind && !!expected.expect.like) {
				if (debug) console.log('check expected Report '+expected);
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
				if (debug) console.log('too many matches for '+expected);
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
			var value = null;
			if ($scope.selectedTestPoint.value)
				value = JSON.parse($scope.selectedTestPoint.value);
			socket.emit('setTestPoint', {iri: $scope.selected['@id'], id: $scope.selectedTestPoint.id, request: mpmAgent.getIri(), value: value});
		}
	}
	$scope.setExpected = function(expected, value) {
		console.log('setExpeced '+expected+' = '+value);
		socket.emit('setTestPoint', {iri: expected.required['@id'], id: expected.expect.testPoint, request: mpmAgent.getIri(), value: value});		
	}
	$scope.post = function(expected, url) {
		console.log('post '+expected+' to '+url);
		socket.emit('post', {iri: expected.required['@id'], path: expected.matches[0].path, url: url, request: mpmAgent.getIri() });		
	}
}]);

module.filter('date', function() {
	  return function(ms) {
		  return new Date(ms).toISOString();
	  }
});
