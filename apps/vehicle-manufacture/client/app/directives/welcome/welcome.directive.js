angular.module('tutorial')

.directive('tutWelcome', [function () {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/welcome/welcome.html',
    link: function (scope, element, attrs) {
        scope.startTutorial = () => {
            scope.location = '/car-builder';
            scope.mode = 'tutorial';

            if (!scope.$$phase) {
                scope.$apply();
            }
        }

        scope.startNormal = () => {
            scope.location = '/car-builder';
            scope.mode = 'normal';

            if (!scope.$$phase) {
                scope.$apply();
            }
        }
    }
  }
}]);