/* main ... */
console.log('mpm...');

var mpm = angular.module('mpm', ['mpm-rdf']);

mpm.controller('MpmMainController', ['mpmStore', function(mpmStore) {
	console.log('MpmMainController mpmStore='+mpmStore);
	var store = mpmStore.get();
	store.load('/rdf/foaf.turtle').then(
			function(success) { console.log('ok: '+success); },
			function(error) { console.log('failed: '+error); });
}]);
