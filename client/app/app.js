angular.module('tutorial', [
  'ui.router'
])

.config(function ($urlRouterProvider, $stateProvider, $locationProvider) {
  'use strict';

  $locationProvider.html5Mode({
    enabled: true
  });

  $stateProvider
    .state('tutorial', {
      url: '/tutorial',
      templateUrl: 'app/views/tutorial/tutorial.html',
      controller: 'TutorialCtrl'
    });
})

.controller('AppCtrl', [function () {
  'use strict';
}]);
