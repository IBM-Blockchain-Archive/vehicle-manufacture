angular.module('tutorial')

.directive('tutSidebar', [function () {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/sidebar/sidebar.html',
    link: function (scope, element, attrs) {
      scope.expanded = false;
    }
  };
}])
