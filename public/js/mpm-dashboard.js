/* main ... */
console.log('dashboard...');

var module = angular.module('mpm-dashboard', ['mpm-rdf', 'muzicodes.logging', 'muzicodes.socket']);

module.controller('DashboardController', ['$scope', 'socket',
                                     function($scope, socket) {
	console.log('DashboardController');
	socket.on('hello', function(msg) {
		console.log('received hello: ', msg);
	});
	socket.emit('hello',{client:'mpm-dashboard',version:'0.1'});
}]);
