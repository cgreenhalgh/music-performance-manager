/* main ... */
console.log('mpm...');

var mpm = angular.module('mpm', ['mpm-rdf']);

mpm.controller('MpmMainController', ['MpmN3test', function(MpmN3test) {
	console.log('MpmMainController MpmN3test='+MpmN3test);
	
}]);
