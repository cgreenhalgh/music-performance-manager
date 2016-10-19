/* music-performance-manager RDF utilities */

var mpm_rdf = angular.module('mpm-rdf', []);

mpm_rdf.factory('MpmN3test', [function() {
	var self = { ready: false };
	var store = N3.Store();
	store.addTriple('http://ex.org/Pluto',  'http://ex.org/type', 'http://ex.org/Dog');
	store.addTriple('http://ex.org/Mickey', 'http://ex.org/type', 'http://ex.org/Mouse');

	var mickey = store.find('http://ex.org/Mickey', null, null)[0];
	console.log(mickey.subject, mickey.predicate, mickey.object, '.');
	
	var parser = N3.Parser();
	console.log('Mpm3test parser='+parser);
	parser.parse('@prefix c: <http://example.org/cartoons#>.\n' +
	             'c:Tom a c:Cat.\n' +
	             'c:Jerry a c:Mouse;\n' +
	             '        c:smarterThan c:Tom.',
	             function (error, triple, prefixes) {
	               if (triple)
	                 console.log(triple.subject, triple.predicate, triple.object, '.');
	               else {
	                 console.log("# That's all, folks!", prefixes);
	                 self.ready = true;
	               }
	             });
	return self;
}]);

console.log('before MpmX');
mpm_rdf.factory('MpmX', ['$http',function($http) {
	console.log('MpmX');
	return {};
}]);