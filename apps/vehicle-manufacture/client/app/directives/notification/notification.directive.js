angular.module('tutorial')

.directive('tutNotification', [function () {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/notification/notification.html',
    link: function (scope, element, attrs) {

      const allowableVerticle = ['top', 'bottom'];
      const allowableHorizontal = ['left', 'right'];

      scope.$on('removeNotification', (event, data) => {
        scope.removeNotification(data[0], data[1], data[2], data[3]);
      })

      scope.removeNotification = (title, text, vertical, horizontal, closed) => {
        scope.notifications.some((scopeNotification, index) => {
          if(title == scopeNotification.title && text == scopeNotification.text && vertical.toLowerCase() == scopeNotification.position.vertical && horizontal.toLowerCase() == scopeNotification.position.horizontal) {
            if(closed) {
              scopeNotification.basedOff.closed = true;
            }
            scope.notifications.splice(index, 1);
            return;
          }
        })

        if (!scope.$$phase) {
          scope.$apply();
        }
      };

      scope.$on('removeAllNotifications', () => {
        scope.notifications = [];
        if (!scope.$$phase) {
          scope.$apply();
        }
      });

      scope.$on('addNotification', (event, data) => {
        scope.addNotifications([data[0]]);
      });

      scope.$on('addNotifications', (event, data) => {
        scope.addNotifications(data[0]);
      })

      scope.addNotifications = (passedNotifications) => {

        passedNotifications.forEach((passedNotification) => {
          if(passedNotification.closed) {
            return;
          }
  
          var title = passedNotification.title;
          var text = passedNotification.text;
          var vertical = passedNotification.vertical;
          var horizontal = passedNotification.horizontal;
  
          vertical = vertical.toLowerCase();
          horizontal = horizontal.toLowerCase();
          var notification = {}
          if (title) {
            notification.title = title;
          }
          notification.text = text;
  
          notification.basedOff = passedNotification;
  
          if (!allowableVerticle.includes(vertical)) {
            throw new Error('Invalid vertical value specified for notification.')
          }
  
          if (!allowableHorizontal.includes(horizontal)) {
            throw new Error('Invalid horizontal value specified for notification.')
          }
          notification.animate = 'fade';
  
          if(notification.basedOff.alreadyShown) {
            notification.animate = 'none'
          }
  
          notification.position = {};
          notification.position.vertical = vertical.toLowerCase();
          notification.position.horizontal = horizontal.toLowerCase();
  
          scope.notifications.forEach((el, index) => {
            if(el.basedOff.alreadyShown) {
              el.animate = 'none';
            }
  
            if (el.position.vertical === notification.position.vertical && el.position.horizontal === notification.position.horizontal) {
              scope.notifications.splice(index, 1);
  
              if(notification.animate != 'none') {
                notification.animate = 'border';
              }
            }
          })
          
          setTimeout(() => {
            notification.basedOff.alreadyShown = true;
          }, 2000)
  
          scope.notifications.push(notification);
        })

        if (!scope.$$phase) {
          scope.$apply();
        }
      }
    }
  };
}])
