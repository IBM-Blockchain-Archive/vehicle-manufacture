angular.module('tutorial')

.directive('tutHeader', [function () {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/header/header.html',
    link: function (scope, element, attrs) {
      scope.$watchCollection(attrs.collection, function(val) {
        switch(scope.location) {
          case '/car-builder': scope.appName = "Vehicle Builder"; scope.identity = {name: "Paul", type: "Car Buyer" }; break;
          case '/manufacturer-dashboard': scope.appName = "Vehicle Manufacture"; scope.identity = {name: "Arium", type: "Manufacturer" }; break;
          case '/regulator-dashboard': scope.appName = "Vehicle Regulator"; scope.identity = {name: "VDA", type: "Regulator" }; break;
        }
        if(!scope.$$phase) {
          scope.$apply()
        }
      });
    }
  };
}])
