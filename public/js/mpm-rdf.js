/* music-performance-manager RDF utilities */

var mpm_rdf = angular.module('mpm-rdf', []);

mpm_rdf.value('OWL_THING', 'http://www.w3.org/2002/07/owl#Thing');
mpm_rdf.value('OWL_CLASS', 'http://www.w3.org/2002/07/owl#Class');
mpm_rdf.value('RDF_TYPE', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
mpm_rdf.value('RDFS_SUB_CLASS_OF', 'http://www.w3.org/2000/01/rdf-schema#subClassOf');
mpm_rdf.value('FOAF_NAME', 'http://xmlns.com/foaf/0.1/name');

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
	// simple data model from store.
	// roots specific by property/value query
	// TODO incremental update
	// mappings, array of
	//   conditions: { name: { subject, predicate, object } }
	//   properties: { name: { type: value | values | children, value: condition name } }
	// Note: _id is a special value for subject/object -> subject id
	MpmStore.prototype.getModel = function(rootPredicate, rootObject, mappings) {
		var roots = this.store.find(null, rootPredicate, rootObject);
		var model = [];
		var self = this;
		function map( subject, item, mappings ) {
			for (var mi in mappings) {
				var failed = false;
				var mapping = mappings[mi];
				var conditionValues = {};
				for (var cname in mapping.conditions) {
					conditionValues[cname] = [];
					var condition = mapping.conditions[cname];
					var ss = self.store.find( condition.subject==='_id' ? item._id : condition.subject, condition.predicate, condition.object==='_id' ? item._id : condition.object );
					for (var si in ss) {
						var s = ss[si];
						if (condition.subject===null || condition.subject===undefined)
							conditionValues[cname].push(s.subject);
						else
							conditionValues[cname].push(s.object);
					}
					if (conditionValues[cname].length==0 && !condition.optional) {
						failed = true;
						break;
					}
				}
				if (failed)
					continue;
				for (var pname in mapping.properties) {
					var property = mapping.properties[pname];
					var value = { predicate: mapping.conditions[property.value].predicate, type: property.type };

					if (property.type=='value') {
						value.value = conditionValues[property.value][0];
					}
					else if (property.type=='values') {
						value.values = conditionValues[property.value];
					}
					else if (property.type=='objects') {
						value.objects = [];
						for (var vi in conditionValues[property.value]) {
							var childid = conditionValues[property.value][vi];
							var child = { _id: childid };
							// recurse
							map( childid, child, mappings );
							value.objects.push( child );
						}
					}
					item[pname] = value;
				}
			}
		};
		for (var ri in roots) {
			var root = roots[ri];
			var item = { _id: root.subject };
			// TODO properties?
			map( root.subject, item, mappings );
			model.push(item);
		}
		return model;
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