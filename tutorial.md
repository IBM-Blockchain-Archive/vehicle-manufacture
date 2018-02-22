# Introduction
## Welcome
Welcome to the vehicle manufacturing sample application. This was built using IBM Blockchain Platform: Develop.

## What can I do in this web application?
You will be able to take on the roles of vehicle buyer, manufacturer and regulator in order to understand how they can communicate using a Blockchain.

[//]: # ('NOTIFICATION | Hello! | Click on the 'Add' icon to bring up the tutorial and begin the demo. | TOP | LEFT | CREATE_WHEN => [] | DESTROY_WHEN => [ LISTENER | EVENT | | #expandContract |  click ]')
[//]: # ('NOTIFICATION |  | If at any point you would like to reset the tutorial and start again, click the icon in the top right. | TOP | RIGHT | CREATE_WHEN => [] | DESTROY_WHEN => [ LISTENER | EVENT | | #reset |  click ]')
[//]: # ('BUTTON | Start Tutorial | /car-builder | ENABLEMENT_RULE => []')

# Building your car
## Step 1
Order your vehicle. Click on your model and select trim, colour, interior and extras. Then, ‘Purchase and Build’.

[//]: # ('NOTIFICATION |  | You are now Paul, a Car Buyer who is interested in ordering a car from the Arium App.  | TOP | LEFT | CREATE_WHEN => [] | DESTROY_WHEN => []')

[//]: # ('BUTTON | See manufacturer's view | /manufacturer-dashboard | ENABLEMENT_RULE => [ REST_EVENT | $class | EQUAL | org.acme.vehicle_network.PlaceOrderEvent]')

# Manufacturing the car
## Step 2
To start the car manufacture process click the yellow ‘Start manufacture’ button.

[//]: # ('NOTIFICATION | | You are now Mike, the Manufacturing Manager at Arium Logistics. Notice, a new order has been recieved. | TOP | RIGHT | CREATE_WHEN => [] | DESTROY_WHEN => []')

[//]: # ('NOTIFICATION | | As the vehicle moves along the production line, elements like chassis will be built and this will be updated on Blockchain. Using blockchain technology the VIN number can be assigned automatically rather than requiring manual approval from the VDA. | TOP | LEFT | CREATE_WHEN => [ LISTENER | EVENT | manufacturer | .start-manufacture | click ] | DESTROY_WHEN => []')

[//]: # ('BUTTON | See regulator's view | /regulator-dashboard | ENABLEMENT_RULE => [ REST_EVENT | $class | EQUAL | org.acme.vehicle_network.UpdateOrderStatusEvent | AND => [ REST_EVENT | orderStatus | EQUAL | DELIVERED ]]')

# Regulating the network
## Step 3
Along the top of the dashboard view, you can see all the new vehicles which need to be assigned VIN numbers. The final transaction is the vehicle asset which has been assigned a VIN.

[//]: # ('NOTIFICATION | | You are now Debbie, the VDA Officer at Vehicle & Drivers Authority. You regulate car manufacture using a web based application.  | TOP | RIGHT | CREATE_WHEN => [] | DESTROY_WHEN => []')