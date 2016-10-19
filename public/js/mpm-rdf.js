/* music-performance-manager RDF utilities */

var mpm_rdf = angular.module('mpm-rdf', []);

// return object with methods
//   get(name) -> wrapper for named N3 Store (common cache, default '_default')
// instance methods:
//   add(statements, graph) - parse and add; return promise resolves to # statements added
//   load(url, graph) - load from url, parse and add
mpm_rdf.factory('mpmStore', ['$q', '$http', function($q, $http) {
	var stores = {};
	function MpmStore(store) {
		this.store = store;
	}
	MpmStore.prototype.add = function(statements, graph) {
		var store = this.store;
		var debug = false;
		var deferred = $q.defer();
		var parser = N3.Parser();
		var count = 0;
		debug && console.log('parse...');
		parser.parse(statements, 
			function (error, triple, prefixes) {
				debug && console.log('callback '+error+', '+triple);
				if (error) {
					deferred.reject('Parse error: '+error);
				}
				else if (triple) {
					store.addTriple(triple.subject, triple.predicate, triple.object, graph);
					count++;
				}
				else {
					debug && console.log('done');
					deferred.resolve(count);
				}
			});
		return deferred.promise;
	}
	MpmStore.prototype.load = function(url, graph) {
		var store = this.store;
		var self = this;
		var debug = false;
		var deferred = $q.defer();
		debug && console.log('load '+url);
		var promise = $http.get(url).then(
			function(response) {
				debug && console.log('success: '+response);
				self.add(response.data, graph).then(
						function(success) { deferred.resolve(success); },
						function(error) { deferred.reject(error); });
			}, function(error) {
				debug && console.log('error: '+error);
				deferred.reject(error);
			});
		return deferred.promise;
	}
	return {
		get: function(name) {
			name = name || '_default';
			if (stores[name]===undefined) {
				stores[name] = new MpmStore( N3.Store() );
			}
			return stores[name];
		}
	};
}]);

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