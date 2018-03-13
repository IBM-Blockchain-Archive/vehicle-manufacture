var destroyed = false;

angular.module('tutorial')

.constant('_', window._)

.controller('TutorialCtrl', ['$scope', '$rootScope', '$timeout', '$sce', '$http', '$cookies', function ($scope, $rootScope, $timeout, $sce, $http, $cookies) {

    destroyed = false;
    $scope.location = '/car-builder';    
    $scope.ready = false;
    $scope.mode = typeof $cookies.get('mode') === 'undefined' ? $scope.mode = 'start' : $cookies.get('mode');
    $scope.tutorialPage = 0;
    $scope.notifications = [];
    localStorage.setItem("ignoreTxnsBefore", new Date());
    
    $http({method: 'GET', url: '/assets/config.json'}).then((config) => {
        $scope.tutorial = config.data.tutorial

        $scope.tutorial.forEach((page) => {
            page.steps = page.steps.map((step) => {
                step.text = $sce.trustAsHtml(step.text);
                step.title = $sce.trustAsHtml(step.title);
                return step;
            })
        });

        $scope.unUpdatedTutorial = _.cloneDeep($scope.tutorial); // CLONE SO IT DOESN'T GET UPDATED

        awaitIFrameLoad($scope, $rootScope);
    })

    openWebSocket($scope, $rootScope);

    $scope.changePage = (newLocation, forward) => {
        if (newLocation) {
            $scope.location = newLocation;
            removeAllListeners();
            $rootScope.$broadcast('removeAllNotifications');
        }

        if ((forward > 0 && $scope.tutorialPage+forward <= $scope.tutorial.length-1) || (forward < 0 && $scope.tutorialPage+forward >= 0))  {
            $scope.tutorialPage += forward;
        }

        if (!$scope.$$phase) {
            $scope.$apply(); 
        }

        $timeout(function(){
            if ($scope.tutorial[$scope.tutorialPage]) {
                setupStageListeners($scope, $scope.tutorial[$scope.tutorialPage].steps[0].listeners, $scope.tutorialPage, 0);
                setupNotifications($scope, $rootScope, $scope.tutorialPage);
            }
        }, 0, false);
    }

    $scope.reset = () => {
        $scope.mode = 'start';
        $scope.expanded = false;
        $scope.tutorialPage = 0;

        removeAllListeners();

        $scope.tutorial = _.cloneDeep($scope.unUpdatedTutorial);

        $scope.ready = false;

        localStorage.setItem("ignoreTxnsBefore", new Date());

        document.getElementById('carBuilder').contentWindow.location.reload();
        document.getElementById('manufacturer').contentWindow.location.reload();
        document.getElementById('regulator').contentWindow.location.reload();

        $scope.changePage('/car-builder', 0);

        awaitIFrameLoad($scope, $rootScope);
    };
    
    $scope.startAgain = () => {
        $scope.location = '/car-builder';
        $scope.mode = 'normal';
        $scope.ready = false;

        removeAllListeners();

        if (!$scope.$$phase) {
            scope.$apply();
        }

        document.getElementById('carBuilder').contentWindow.location.reload();
        document.getElementById('manufacturer').contentWindow.location.reload();
        document.getElementById('regulator').contentWindow.location.reload();

        awaitIFrameLoad($scope, $rootScope);
    }

    $scope.$on('$destroy', function () {
        destroyed = true;
    });

    $scope.$watch('mode', () => {
        $cookies.put('mode', $scope.mode);
    });
}])

.directive('initBind', function($compile) {
    return {
            restrict: 'A',
            link : function (scope, element, attr) {
                attr.$observe('ngBindHtml',function(){ // LISTEN TO BIND TO ALLOW FOR NG-CLICKS IN HTML BEING BOUND
                    if(attr.ngBindHtml){
                         $compile(element[0].children)(scope);
                    }
                })
            }
        };
    })

var openListeners = [];

function awaitIFrameLoad($scope, $rootScope) {
    document.getElementById('carBuilder').addEventListener('load', function (){
        document.getElementById('carBuilder').removeEventListener('load', arguments.callee);

        setupNotifications($scope, $rootScope, 0);

        if($scope, $scope.tutorial[0].button.enablementRule) {
            setupObjectListeners($scope, $scope.tutorial[0].button.enablementRule, () => {
                $scope.tutorial[0].button.disabled = false;
                if(!$scope.$$phase) {
                    $scope.$apply();
                }
            });
        }

        setupStageListeners($scope, $scope.tutorial[0].steps[0].listeners, 0, 0);

        $scope.mode = $scope.mode;
        $scope.ready = true;
        if(!$scope.$$phase) {
            $scope.$apply();
        }
    });
}

function openWebSocket($scope, $rootScope) {
  var wsUri = '';
  if (location.protocol === 'https:') {
    wsTxt = '[wss]';
    wsUri = 'wss://' + location.host;
  } else {
    wsUri = 'ws://' + location.hostname + ':' + location.port;
  }
  console.log(' Connecting to websocket', wsUri);
    var webSocketURL = wsUri;
    var websocket = new WebSocket(webSocketURL);
    websocket.onopen = function () {
        console.log('Tutorial websocket is open');
    };

    websocket.onclose = function () {
        console.log('Tutorial websocket closed');
        if (!destroyed) {
            openWebSocket($scope, $rootScope);
        }
    }

    websocket.onmessage = function (event) {
        let message = JSON.parse(event.data);

        if ($scope.mode === 'normal') {
            return;
        }
        let button = $scope.tutorial[$scope.tutorialPage].button;
        if (button.enablementRule && button.enablementRule.rule_type === 'REST_EVENT' && evaluateRuleSetAgainstEvent(button.enablementRule, message)) {
            button.disabled = false;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }

        let notifications = $scope.tutorial[$scope.tutorialPage].notifications;
        let notificationsToAdd = [];
        notifications.forEach((notification, index) => {
            if(notification.createWhen && notification.createWhen.rule_type === 'REST_EVENT' && evaluateRuleSetAgainstEvent(notification.createWhen, message)) {
                notificationsToAdd.push(notification);
            } else if(notification.destroyWhen && notification.destroyWhen.rule_type === 'REST_EVENT' && evaluateRuleSetAgainstEvent(notification.createWhen, message)) {
                $rootScope.$broadcast('removeNotification', [notification.title, notification.text, notification.vertical, notification.horizontal]);
            }
        })
        $rootScope.$broadcast('addNotifications', [notificationsToAdd]);
    }
}

function setupNotifications($scope, $rootScope, pageNumber) {
    $scope.tutorial[pageNumber].notifications.forEach((notification, index) => {

        if(!notification.createWhen) {
            $rootScope.$broadcast('addNotification', [notification]);
        } else if(notification.createWhen.rule_type === 'LISTENER') {
            setupObjectListeners($scope, notification.createWhen, () => {
                $rootScope.$broadcast('addNotification', [notification]);
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
    
    var leftHand = calculateBoolean(object[rule.key], rule.comparison, rule.value);

    if (rule.combineWith) {
        switch(rule.combineWith.connection) {
            case 'AND': return leftHand && evaluateRuleSetAgainstEvent(rule.combineWith.rule, object);
            case 'OR': return leftHand || evaluateRuleSetAgainstEvent(rule.combineWith.rule, object);
            default: throw new Error('Connection value invalid', rule.combineWith.connection)
        }
    }

    return leftHand;
}

function calculateBoolean(variable, comparison, value) {
    switch(comparison) {
        case 'EQUAL': return (variable === value); break;
        case 'NOT EQUAL': return (variable !== value); break;
        case 'GREATER THAN': return (variable > value); break;
        case 'GREATER THAN OR EQUAL': return (variable >= value); break;
        case 'LESS THAN': return (variable > value); break;
        case 'LESS THAN OR EQUAL': return (variable >= value); break;
        default: throw new Error('Comparison value invalid', comparison);
    }
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

    if(scope.mode === 'normal') {
        return;
    }

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
                case 'SCOPE': addScopeWatcher(scope, rule.variable, rule.comparison, rule.value, callback, relatedId); break;
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
        } else if (el.type === 'ScopeWatcher') {
            el.deregister();
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
            } else if (el.type === 'ScopeWatcher') {
                el.deregister();
                openListeners.splice(i, 1);
            }
        }
    }
}

function setupStageListeners(scope, listenerDetails, pageNumber, stepNumber) {

    if(scope.mode === 'normal') {
        return;
    }

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
            case 'SCOPE': addScopeWatcher(scope, rule.variable, rule.comparison, rule.value, callback, relatedId); break;
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
        for(var i = 0; i < listenTo.length; i++) {
            openListeners.forEach((el, index, object) => {
                if (el.id === listenerId) {
                    object.splice(index, 1);
                }
            });
            listenTo[i].removeEventListener(listenType, listenAction);
        }
        callback();
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
                openListeners.forEach((el, index, object) => {
                    if (el.id === listenerId) {
                        object.splice(index, 1);
                    }
                });
                observer.disconnect();
                callback();
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
        var el = listenIn.getElementById(listenElement.substr(1));
        if (el) {
            listenTo = [el];
        } else {
            console.log('LISTEN IN', listenIn.getElementsByTagName('button'))
            throw new Error(`Element with ID ${listenElement.substr(1)} does not exist`);
        }

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

function addScopeWatcher(scope, variable, comparison, value, callback, relatedId) {
    var watcher = scope.$watch(variable, (newValue) => {
        if (calculateBoolean(newValue, comparison, value)) {
            openListeners.forEach((el, index, object) => {
                if (el.id === listenerId) {
                    el.deregister();
                    object.splice(index, 1);
                }
            });
            callback();
        }
    });
    
    var listenerId = makeId();
    openListeners.push({
        type: 'ScopeWatcher',
        deregister: watcher,
        id: listenerId,
        relatedId: relatedId
    });
}

function makeId() {
    return Math.random().toString(36).substr(2, 10)
  }