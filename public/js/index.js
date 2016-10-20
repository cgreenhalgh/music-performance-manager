/* main ... */
console.log('mpm...');

var mpm = angular.module('mpm', ['mpm-rdf']);

mpm.controller('MpmMainController', ['$scope', 'mpmStore', 'RDFS_SUB_CLASS_OF', 'OWL_THING', 'RDF_TYPE', 
                                     'FOAF_NAME',
                                     function($scope, mpmStore, RDFS_SUB_CLASS_OF, OWL_THING, RDF_TYPE,
                                    		 FOAF_NAME) {
	console.log('MpmMainController mpmStore='+mpmStore);
	$scope.classes = [];
	var store = mpmStore.get();
	store.load('/rdf/foaf.turtle').then(
			function(success) {
				console.log('ok: '+success); 
				var mapping = 
					[
 						{ 
 							conditions: { instances: { predicate: RDF_TYPE, object: '_id' } },
 							properties: { instances: { type: 'objects', value: 'instances' } }
 						},
 						{ 
 							conditions: { name: { subject: '_id', predicate: FOAF_NAME, optional: true } },
 							properties: { name: { type: 'value', value: 'name' } }
 						}
					 ];
				$scope.classes = store.getModel(RDFS_SUB_CLASS_OF, OWL_THING, mapping);
				console.log('classes: '+$scope.classes);
			},
			function(error) { console.log('failed: '+error); });
}]);

mpm.directive('mpmClassList', [function() {
	return {
		restrict: 'E',
		scope: {
			ngModel: '='
		},
		template: '<ul><mpm-class ng-repeat="root in ngModel" ng-model="root"></mpm-class></ul>',
		link: function(scope, element, attrs) {
		}
	};
}]);
mpm.directive('mpmClass', [function() {
	return {
		restrict: 'E',
		scope: {
			ngModel: '='
		},
		template: '<li>{{ ngModel._id }}</li><ul><li ng-repeat="item in ngModel.instances.objects">{{ item._id }} {{ item.name.value }}</li></ul>',
		link: function(scope, element, attrs) {
		}
	};
}]);