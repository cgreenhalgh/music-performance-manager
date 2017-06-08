/* main ... */
console.log('browserview...');

var module = angular.module('mpm-browserview', ['mpm-rdf', 'muzicodes.logging', 'muzicodes.socket', 'mpm-agent', 'mpm-loguse']);

module.config(function($locationProvider) {
	  $locationProvider.html5Mode({
		  enabled: true,
		  requireBase: false
		});
});

module.controller('BrowserviewController', ['$scope','socket','mpmAgent', '$sce', '$location', '$timeout', 'mpmLoguse',
                                     function($scope,  socket,  mpmAgent, $sce, $location, $timeout, mpmLoguse) {
	console.log('BrowserviewController');
	
	$scope.showconfig = true;
	var params = $location.search();
	console.log('params', params);
	$scope.name = params['n']===undefined ? '' : params['n'];
	$scope.url = params['u']===undefined ? '' : params['u'];
	$scope.internalUrl = null;
	console.log('name = '+$scope.name);
	
	$('.configbar').on('mouseenter', function() {
		console.log('show config');
		if (!$scope.showconfig) {
			$scope.showconfig = true;
			$scope.$apply();
		}
	});
	
	mpmAgent.init({name:'mpm-browserview'});
	mpmAgent.addTestPoints({reload:{write:true, setter: function(name,value) {
		console.log('Reload from test point');
		$scope.load();
	}},
	url:{name:'URL', read:true, write:true, monitor:true, setter: function(id,value) {
		console.log('set url through test point to '+value);
		$scope.url = value;
		$scope.load();
	}}});
	socket.on('hello', function(msg) {
		console.log('received hello: ', msg);
	});
	socket.emit('hello',{client:'mpm-browserview',version:'0.1'});
	
	// initial subscribe
	//socket.emit('subscribe', 'mpm');
	socket.on('reconnect', function(msg) {
		console.log('reconnected');
	});
	
	$scope.load = function() {
		$scope.internalUrl = $sce.trustAsResourceUrl('data:text/plain,');
		$timeout(function() {
			$scope.internalUrl = $sce.trustAsResourceUrl($scope.url);
			console.log('load '+$scope.url+' -> '+$scope.internalUrl);
			$scope.showconfig = false;
			mpmAgent.configure({name:$scope.name, url: $scope.url});
			mpmAgent.setTestPointValues({url: $scope.url});
		}, 500);
	}
	$('.iframe').on('load', function() {
		console.log('loaded');
		mpmAgent.configure({name:$scope.name, url: $scope.url, loaded: (new Date()).toISOString()});
	});
	if ($scope.url)
		$scope.load();
	else {
		mpmAgent.configure({name:$scope.name, url: $scope.url});
	}		
	// http://stackoverflow.com/questions/2429045/iframe-src-change-event-detection
	
}]);
