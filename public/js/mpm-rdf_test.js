describe('mpm-rdf module', function() {
	beforeEach(module('mpm-rdf'));


	describe('mpmStore', function() {
		// 1
		it('should return the same store for the same name', function() {
			
			inject(function(mpmStore) {
				expect(mpmStore.get('a')).toEqual(mpmStore.get('a'));
			});
		});
		it('should return number of statements added', function(done) {
			
			inject(function(mpmStore, $rootScope) {
				var store = mpmStore.get();
				var promise = store.add(
						'@prefix c: <http://example.org/cartoons#>.\n' +
						'c:Tom a c:Cat.\n' +
						'c:Jerry a c:Mouse;\n' +
						'        c:smarterThan c:Tom.');
				promise.then(function(count) {
					console.log('read '+count+' triples');
					expect(count).toEqual(3);
					done();
				}, function(error) {
					console.log('error: '+error);
					// force error
					expect(error).toBeNull();
					done();
				});
				// kick promises - ugly :-/
				setTimeout(function() {
					$rootScope.$apply();					
				}, 100);
			});
		});
		it('should signal parse errors', function(done) {
			
			inject(function(mpmStore, $rootScope) {
				var store = mpmStore.get();
				var promise = store.add('fooo bar');
				promise.then(function(count) {
					// force error
					expect(count).toBeUndefined();
					done();
				}, function(error) {
					console.log('error: '+error);
					expect(error).toBeDefined();
					done();
				});
				// kick promises - ugly :-/
				setTimeout(function() {
					$rootScope.$apply();					
				}, 100);
			});
		});
	});
});