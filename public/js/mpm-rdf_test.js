describe('mpm-rdf module', function() {
	beforeEach(module('mpm-rdf'));

	describe('MpmN3test', function() {
		// 1
		it('should be defined', function(done) {
			
			inject(function(MpmN3test) {
				setTimeout(function() {
					expect(MpmN3test.ready).toEqual(true);					
					done();
					
				}, 1000);
			});
		});
	});
});