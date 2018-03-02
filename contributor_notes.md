# Contributing to the tutorial

The tutorial is written in markdown with top headers (\#) denoting the different pages and second headers (\#\#) denoting the stages to appear on those pages. The text for a stage is written below the second header.

## Example 

\# Building a car

\## Start the process

Click 'BUILD YOUR CAR'

Links can be specified using the usual markdown format. Warning specifying a link of /LICENSE.txt will take the user to a different location when clicked viewing the markdown on github compared to clicking the link within the tutorial application so full URL paths should be used. 

# Using hidden values

Using hidden values in the markdown you can specify when notifications should appear, the buttons for a page and when stages on a page should be marked as complete. The hidden values are denoted using [//]: # ('<YOUR_RULE>') on a new line.

## Specifying a listener
Listeners are used to mark when a stage on a page is complete and should be added below a second header (\#\#) before the next header of any level. Listeners can listen against the dom and can be specified to look against an element in the tutorial dom or within one of the iframes. They can also be used to listen against variables in the scope. Listeners can be used to listen for an event happening to an element such as it being clicked or its attribute mutating else they can be used to listen for a scope value changing. You can have 0 or more listeners in a section however it will be marked as complete when any one of the listeners' event's happens. The format of a listener is as follows:

DOM Listener: 
`[//]: # ('LISTENER | <TYPE> | <IFRAME_ID> | <ELEMENT> | <LISTENING_FOR>')`

- \<TYPE> - the type of listener being created. Can be EVENT or ATTRIBUTE. Use EVENT to listen for events such as 'click'. Use ATTRIBUTE for listening to attribute mutations e.g. a button being disabled.
- <IFRAME_ID> - the ID of the iframe to listen in. If the element being listened against is not in an iframe leave this blank.
- \<ELEMENT> - the class or ID name of the element to listen for. Precede class names with . and ID names with \#.
- <LISTENING_FOR> - The event being listened for e.g. click or the attribute to watch mutations on e.g. disabled. The list of events that can fill this valuefor EVENT type listeners matches those that can be used on dom elements in addEventListener of JavaScript.

Scope Listener:
`[//]: # ('LISTENER | SCOPE | <COMPARISON> | <VARIABLE_NAME> | <VALUE>')`

- <\COMPARISON> - the type of comparison to use for evaluating a boolean between scope variable's value and <VALUE>. Can be any of: EQUAL, NOT EQUAL, GREATER THAN, GREATER THAN OR EQUAL, LESS THAN or LESS THAN OR EQUAL.
- <VARIABLE_NAME> - the name of the scope variable to listen for changes on.
- <VALUE> - The value to be used for checking against the scope variable's value.

## Specifying an inline button
Inline buttons are buttons that appear within the text of the step. These should be added between the paragraphs they should appear between in the application. They MUST be written on new lines like any other of the hidden elements. Inline buttons should have specified a function with the action they perform. The format of inline buttons is as follows:

`[//]: # ('INLINE_BUTTON | <BUTTON_TEXT> | <FUNCTION>')`

- <BUTTON_CALL> - the text you wish to have in the button
- \<FUNCTION> - the function you would like to be called. Must be preceded with `FUNCTION =>` followed by the function defined in the format specified in the [Defining functions](#functionDefinition) section of this document. 

## Specifying a button
At the end of each page of the tutorial a button is used to move the user onto the next page of the tutorial and if required display another application in the iFrame. Therefore each top header should contain a button hidden value before the next top header section starts. The format of these rules are as follows: 

`[//]: # ('BUTTON | <BUTTON_TEXT> | <NEW_LOCATION> | <ENABLEMENT_RULE>')`

- <BUTTON_TEXT> - the text to be present in your button (this can contain HTML)
- <NEW_LOCATION> - the new value for the scope location variable to be set to so that the iFrame can be changed e.g. /car-builder would bring up the car building application iFrame. Leave this field blank if you do not wish to change the location.
- <ENABLEMENT_RULE> - The rules set that describes when a button should become active. Enablement rules should be specified as `ENABLEMENT_RULE =>` followed by the rules set as defined in the [Defining rules](#rulesDefinition) section of this document. If a button should always be active use an empty rule set e.g. [].

## Specifying a notification
Each section can have any number of notifications (although for now the notification display system will only show four at a time, one for each of top left, top right, bottom left and bottom right). These can be specified using the following  format:

`[//]: # ('NOTIFICATION | <TITLE> | <MESSAGE> | <VERTICAL_POSITION> | <HORIZONTAL_POSITION> | <CREATE_WHEN> | <DESTROY_WHEN>')`

- \<TITLE> - the title of the notification, leave blank if you wish to have no title in the notification.
- \<MESSAGE> - the body of the notification.
- <VERTICAL_POSITION> - where vertically on the page the notification should be positioned. Can currently be set to TOP or BOTTOM.
- <HORIZONTAL_POSITION> - where horizontally on the page the notification should be positioned. Can currently be set to TOP or BOTTOM.
- <CREATE_WHEN> - The rules set that describes when the notification should appear. This should be specified as `CREATE_WHEN =>` followed by the rules set as defined in the [Defining rules](#rulesDefinition) section of this document. If the notification should appear as soon as the user reaches that section of the tutorial use an empty rule set e.g. [].
- <DESTROY_WHEN> - The rules set that describes when the notification should appear. This should be specified as `DESTROY_WHEN =>` followed by the rules set as defined in the [Defining rules](#rulesDefinition) section of this document. If the notification should only be destroyed when the user clicks the notification close button or moves to a new section or page then use an empty rule set e.g. [].

## Defining rules<a name="rulesDefinition"></a>
Rules can be combined with further rules and should be written in square brackets to denote each rule. There are two types of rules that can written and these are:
- LISTEN - listen against the dom.
- REST_EVENT - listen for an event being produced by the REST Server.

LISTEN rules follow the same format as described in the [Specifying a listener](#listenerDefinition) e.g. [ LISTENER | EVENT | iframe1 | button1 | click ].

REST_EVENT rules are formatted as follows: 

`[ REST_EVENT | <FIELD> | <COMPARISON> | <VALUE> ]`

- \<FIELD> - the property of the event to compare against. If it is a subproperty you wish to compare use dots to seperate the levels e.g. address.postcode
- \<COMPARISON> - the type of comparison to perform against the <VALUE>. Can be any of: EQUAL, NOT EQUAL, GREATER THAN, GREATER THAN OR EQUAL, LESS THAN or LESS THAN OR EQUAL.
- \<VALUE> - the value you wish to compare the field against

### Combining rules
If you wish to combine rules add a further `|` at the end of you rule with the following format:

`<COMBINATION> => <RULE>`

- <COMBINATION> - the logical combination for joining that rule with another rule. Can be either AND or OR.
- <RULE> - Another rule in the same format as described in this section. This rule can have its own combination with another rule. 

**WARNING: You cannot mix rule types. E.g. One REST_EVENT combines with a LISTEN**

Notes:
- When combining REST_EVENT rules all the rules will be evaluated each time an event is fired therefore you cannot write a rule that relies on two different events.
- When combining the LISTEN rules once a listen event occurs that matches one of the rules the rule is marked as true therefore you can write rules that rely on actions that occcur at different times.

#### Rule evaluation

Rules are evaluated from right to left based on combines with such that if you have a RULE1 which combines with RULE2 using AND and RULE2 combines with RULE3 using OR the resulting logical operation would be (RULE1 AND (RULE2 OR RULE3)).

### Example rule with a combination:

`[ REST_EVENT | $class | EQUAL | org.acme.vehicle_network.UpdateOrderStatusEvent | AND => [ REST_EVENT | orderStatus | EQUAL | DELIVERED ] ]`

True when the rest server produces an event that has property $class with the value 'org.acme.vehicle_network.UpdateOrderStatusEvent' and that event also has the property orderStatus with the value 'DEVLIVERED'.

## Defining functions<a name="functionsDefinition"></a>
Function definitions are of the format:

`[ <FUNCTION_NAME> | [ <ARGS> ] ]`

- <FUNCTION_NAME> - the name of the function to be called. Must be the name of a function defined in the scope
- \<ARGS> - the arguments to be passed into the function. Must be of format `ARGS =>` followed by the args set (the list of arguments seperated by pipes). Variables cannot be used as they will be sent as strings of the variable names. Arguments should be formatted as they would be in JavaScript e.g. with quotes.