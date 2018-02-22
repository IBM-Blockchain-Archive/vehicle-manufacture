angular.module('tutorial')

.controller('TutorialCtrl', ['$scope', '$rootScope', '$sce', '$http', function ($scope, $rootScope, $sce, $http) {
    var destroyed = false;
    $scope.location = '/car-builder';    
    $scope.ready = false;
    $scope.mode = 'normal';
    $scope.tutorialPage = 0;
    $scope.notifications = [];
    
    $http({method: 'GET', url: '/assets/config.json'}).then((config) => {
        $scope.tutorial = config.data.tutorial

        $scope.tutorial.forEach((page) => {
            page.steps = page.steps.map((step) => {
                step.text = $sce.trustAsHtml(step.text);
                step.title = $sce.trustAsHtml(step.title);
                return step;
            })
        });

        document.getElementById('carBuilder').addEventListener('load', function (){
            document.getElementById('carBuilder').removeEventListener('load', arguments.callee);
            $scope.ready = true;
            if(!$scope.$$phase) {
                $scope.$apply();
            }

            setupNotifications($scope, $rootScope, 0);

            let setMode = () => {
                $scope.mode = 'tutorial';
                if(!$scope.$$phase) {
                    $scope.$apply();
                }
                document.getElementsByClassName('tutorial-button')[0].removeEventListener('click', this);
            }

            document.getElementsByClassName('tutorial-button')[0].addEventListener('click', setMode);

            if($scope, $scope.tutorial[0].button.enablementRule) {
                setupObjectListeners($scope, $scope.tutorial[0].button.enablementRule, () => {
                    $scope.tutorial[0].button.disabled = false;
                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                });
            }

            setupStageListeners($scope, $scope.tutorial[0].steps[0].listeners, 0, 0);
        });  
    })

    function openWebSocket() {
        var webSocketURL = 'ws://' + location.host;
        let websocket = new WebSocket(webSocketURL);
        websocket.onopen = function () {
            console.log('Tutorial websocket is open');
        }
    
        websocket.onclose = function () {
            console.log('Tutorial websocket closed');
            if (!destroyed) {
                openWebSocket();
            }
        }
    
        websocket.onmessage = function (event) {
            let message = JSON.parse(event.data);

            let button = $scope.tutorial[$scope.tutorialPage].button;
            if (button.enablementRule && button.enablementRule.rule_type === 'REST_EVENT' && evaluateRuleSetAgainstEvent(button.enablementRule, message)) {
                button.disabled = false;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }

            let notifications = $scope.tutorial[$scope.tutorialPage].notifications;
            notifications.forEach((notification, index) => {
                if(notification.createWhen && notification.createWhen.rule_type === 'REST_EVENT' && evaluateRuleSetAgainstEvent(notification.createWhen, message)) {
                    $rootScope.$broadcast('addNotification', [notification.title, notification.text, notification.vertical, notification.horizontal]);
                } else if(notification.destroyWhen && notification.destroyWhen.rule_type === 'REST_EVENT' && evaluateRuleSetAgainstEvent(notification.createWhen, message)) {
                    $rootScope.$broadcast('removeNotification', [notification.title, notification.text, notification.vertical, notification.horizontal]);
                }
            })
        }
    }
    openWebSocket();

    $scope.changePage = (newLocation, forward) => {
        if (newLocation) {
            $scope.location = newLocation;
            removeAllListeners();
            $rootScope.$broadcast('removeAllNotifications');
        }

        if ((forward > 0 && $scope.tutorialPage+forward <= $scope.tutorial.length-1) || (forward < 0 && $scope.tutorialPage+forward >= 0))  {
            $scope.tutorialPage += forward;
        }

        if ($scope.tutorial[$scope.tutorialPage]) {
            setupStageListeners($scope, $scope.tutorial[$scope.tutorialPage].steps[0].listeners, $scope.tutorialPage, 0);
            setupNotifications($scope, $rootScope, $scope.tutorialPage);
        }

        if (!$scope.$$phase) {
            $scope.$apply(); 
        }
    }
    

    $scope.$on('$destroy', function () {
        destroyed = true;
    });

}]);

var openListeners = [];

function setupNotifications($scope, $rootScope, pageNumber) {
    $scope.tutorial[pageNumber].notifications.forEach((notification, index) => {

        if(!notification.createWhen) {
            $rootScope.$broadcast('addNotification', [notification.title, notification.text, notification.vertical, notification.horizontal]);
        } else if(notification.createWhen.rule_type === 'LISTENER') {
            setupObjectListeners($scope, notification.createWhen, () => {
                $rootScope.$broadcast('addNotification', [notification.title, notification.text, notification.vertical, notification.horizontal]);
            });
        }

        if(notification.destroyWhen && notification.destroyWhen.rule_type === 'LISTENER') {
            setupObjectListeners($scope, notification.destroyWhen, () => {
                $rootScope.$broadcast('removeNotification', [notification.title, notification.text, notification.vertical, notification.horizontal]);
            });
        }
    });
}

function getiFrame(frameId) {
    let iframe = document.getElementById(frameId);
    return (iframe.contentDocument) ? iframe.contentDocument : iframe.contentWindow.document;
};

function evaluateRuleSetAgainstEvent(rule, object) {
    
    var leftHand;

    switch(rule.comparison) {
        case 'EQUAL': leftHand = (object[rule.key] === rule.value); break;
        case 'NOT EQUAL': leftHand = (object[rule.key] !== rule.value); break;
        case 'GREATER THAN': leftHand = (object[rule.key] > rule.value); break;
        case 'GREATER THAN OR EQUAL': leftHand = (object[rule.key] >= rule.value); break;
        case 'LESS THAN': leftHand = (object[rule.key] > rule.value); break;
        case 'LESS THAN OR EQUAL': leftHand = (object[rule.key] >= rule.value); break;
        default: throw new Error('Comparison value invalid', rule.comparison);
    }

    if (rule.combineWith) {
        switch(rule.combineWith.connection) {
            case 'AND': return leftHand && evaluateRuleSetAgainstEvent(rule.combineWith.rule, object);
            case 'OR': return leftHand || evaluateRuleSetAgainstEvent(rule.combineWith.rule, object);
            default: throw new Error('Connection value invalid', rule.combineWith.connection)
        }
    }

    return leftHand;
}

function checkAllRulesListenersComplete(ruleSet) {
    function isComplete(rule) {
        if(rule.combineWith) {
            switch(rule.combineWith.connection) {
                case 'AND': return rule.complete && isComplete(rule.combineWith.rule);
                case 'OR': return rule.complete || isComplete(rule.combineWith.rule);
                default: throw new Error('Connection value invalid', rule.combineWith.connection)
            }
        }
        return rule.complete;
    }
    
    return isComplete(ruleSet)
}

function setupObjectListeners(scope, ruleSet, completed) {
    let relatedId = makeId();
    function createListener(rule) {
        if(rule.rule_type === 'LISTENER') {

            let callback = () => {
                rule.complete = true;

                if (!scope.$$phase) {
                    scope.$apply();
                }

                if (checkAllRulesListenersComplete(ruleSet)) {
                    removeRelatedListeners(relatedId);
                    completed();
                }
            }

            switch(rule.type) {
                case 'EVENT': addDomEventListener(rule.iFrame, rule.element, rule.listenFor, callback, relatedId); break;
                case 'ATTRIBUTE': addAttributeListener(rule.iFrame, rule.element, rule.listenFor, callback, relatedId); break;
            }
        }

        if (rule.combineWith) {
            createListener(rule.combineWith.rule)
        }
    }
    createListener(ruleSet)
}

function removeAllListeners() {
    for (var i = openListeners.length-1; i >= 0; i--) {
        var el = openListeners[i];
        if (el.type === 'EventListener') {
            el.element.removeEventListener(el.listenType, el.callback);
            openListeners.splice(i, 1);
        } else if (el.type === 'MutationObserver') {
            el.observer.disconnect();
            openListeners.splice(i, 1);
        }
    }
}

function removeRelatedListeners(relatedId) {
    for (var i = openListeners.length-1; i >= 0; i--) {
        var el = openListeners[i]
        if(el.relatedId === relatedId) {
            if (el.type === 'EventListener') {
                el.element.removeEventListener(el.listenType, el.callback);
                openListeners.splice(i, 1);
            } else if (el.type === 'MutationObserver') {
                el.observer.disconnect();
                openListeners.splice(i, 1);
            }
        }
    }
}

function setupStageListeners(scope, listenerDetails, pageNumber, stepNumber) {
    let relatedId = makeId();
    let callback = () => {
        scope.tutorial[pageNumber].steps[stepNumber].complete = true;
        if (!scope.$$phase) {
            scope.$apply();
        }
        if (stepNumber < scope.tutorial[pageNumber].steps.length-1) {
            removeRelatedListeners(relatedId);
            setupStageListeners(scope, scope.tutorial[pageNumber].steps[stepNumber+1].listeners, pageNumber, stepNumber+1);
        }
    }

    listenerDetails.forEach((listenerDef) => {
        switch(listenerDef.type) {
            case 'EVENT': addDomEventListener(listenerDef.iFrame, listenerDef.element, listenerDef.listenFor, callback, relatedId); break;
            case 'ATTRIBUTE': addAttributeListener(listenerDef.iFrame, listenerDef.element, listenerDef.listenFor, callback, relatedId); break;
        }
    })
}

function addDomEventListener(frameId, listenElement, listenType, callback, relatedId) {
    var listenTo;
    var listenerId = makeId();
    var listenIn = document;

    if (frameId) {
        listenIn = getiFrame(frameId)
    }

    if (listenElement.startsWith('#')) {
        listenTo = [listenIn.getElementById(listenElement.substr(1))];

    } else if (listenElement.startsWith('.')) {
        listenTo = listenIn.getElementsByClassName(listenElement.substr(1));
    } else {
        throw new Error('Element to listen against should start with # for ID or . for class.')
    }

    var listenAction = () => {
        callback();
        for(var i = 0; i < listenTo.length; i++) {
            openListeners.forEach((el, index, object) => {
                if (el.id === listenerId) {
                    object.splice(index, 1);
                }
            });
            listenTo[i].removeEventListener(listenType, listenAction);
        }
    };

    for(var i = 0; i < listenTo.length; i++) {
        openListeners.push({
            type: 'EventListener',
            element: listenTo[i],
            listenType: listenType,
            callback: listenAction,
            id: listenerId,
            relatedId: relatedId
        });
        listenTo[i].addEventListener(listenType, listenAction);
    }
}

function addAttributeListener(frameId, listenElement, attributeToListen, callback, relatedId) {
    var listenerId = makeId();
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    var observer = new MutationObserver(function(mutations, observer) {
        mutations.forEach(function(mutation) {
          if (mutation.type == 'attributes') {
            if (mutation.attributeName === attributeToListen) {
                callback();
                openListeners.forEach((el, index, object) => {
                    if (el.id === listenerId) {
                        object.splice(index, 1);
                    }
                });
                observer.disconnect();
            }
          }
        });
    });

    var listenTo;
    var listenIn = document;

    if (frameId) {
        listenIn = getiFrame(frameId)
    }

    if (listenElement.startsWith('#')) {
        listenTo = [listenIn.getElementById(listenElement.substr(1))];

    } else if (listenElement.startsWith('.')) {
        listenTo = listenIn.getElementsByClassName(listenElement.substr(1));
    } else {
        throw new Error('Element to listen against should start with # for ID or . for class.')
    }

    for(var i = 0; i < listenTo.length; i++) {
        openListeners.push({
            type: 'MutationObserver',
            observer: observer,
            id: listenerId,
            relatedId: relatedId
        });
        observer.observe(listenTo[i], {
            attributes: true //configure it to listen to attribute changes
        });
    }
}

function makeId() {
    return Math.random().toString(36).substr(2, 10)
  }