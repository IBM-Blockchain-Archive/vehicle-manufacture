# Building your car
## Step 1
[//]: # ('LISTENER | ATTRIBUTE | | .tutorial-button | disabled')

Order your vehicle. Click 'Design your car' then select the model you'd like. Select the trim, colour, interior and extras.

When you're finished click 'Place order'.

[//]: # ('NOTIFICATION | Hello! | Click on the 'Add' icon to bring up the tutorial and begin the demo. | TOP | LEFT | CREATE_WHEN => [ LISTENER | SCOPE | EQUAL | mode | tutorial | OR => [ LISTENER | EVENT | | #reset | click ]] | DESTROY_WHEN => [ LISTENER | EVENT | | #expandContract |  click ]')
[//]: # ('NOTIFICATION |  | If at any point you would like to reset the tutorial and start again, click the icon in the top right. | TOP | RIGHT | CREATE_WHEN => [ LISTENER | SCOPE | EQUAL | mode | tutorial | OR => [ LISTENER | EVENT | | #reset | click ]] | DESTROY_WHEN => [ LISTENER | EVENT | | #reset |  click ]')

[//]: # ('NOTIFICATION |  | You are now Paul, a Car Buyer who is interested in ordering a car from the Arium App.  | TOP | LEFT | CREATE_WHEN => [ LISTENER | EVENT | | #expandContract |  click ] | DESTROY_WHEN => []')

[//]: # ('BUTTON | Next Step | /manufacturer-dashboard | ENABLEMENT_RULE => [ REST_EVENT | $class | EQUAL | org.acme.vehicle_network.PlaceOrderEvent]')

# Manufacturing the car
## Step 2
[//]: # ('LISTENER | ATTRIBUTE | | .tutorial-button | disabled')

To start the car manufacture process click the yellow ‘Start manufacture’ button.

[//]: # ('NOTIFICATION | | You are now Mike, the Manufacturing Manager at Arium Logistics. Notice, a new order has been recieved. | TOP | RIGHT | CREATE_WHEN => [] | DESTROY_WHEN => []')

[//]: # ('NOTIFICATION | | As the vehicle moves along the production line, elements like chassis will be built and this will be updated on the blockchain. Using blockchain technology the VIN number can be assigned automatically rather than requiring manual approval from the VDA. | TOP | LEFT | CREATE_WHEN => [ LISTENER | EVENT | manufacturer | .start-manufacture | click ] | DESTROY_WHEN => []')

[//]: # ('BUTTON | Next Step | /regulator-dashboard | ENABLEMENT_RULE => [ REST_EVENT | $class | EQUAL | org.acme.vehicle_network.UpdateOrderStatusEvent | AND => [ REST_EVENT | orderStatus | EQUAL | DELIVERED ]]')

# Regulating the network
## Step 3
Along the top of the dashboard view, you can see all the new vehicles which need to be assigned VIN numbers. The final transaction is the vehicle asset which has been assigned a VIN.

[//]: # ('NOTIFICATION | | You are now Debbie, the VDA Officer at Vehicle & Drivers Authority. You regulate car manufacture using a web based application.  | TOP | RIGHT | CREATE_WHEN => [] | DESTROY_WHEN => []')

[//]: # ('BUTTON | Next Step | /car-builder | ENABLEMENT_RULE => []')

# Reviewing the purchase
## Step 4
Paul is kept updated within the Arium phone application of the status of his order.

[//]: # ('BUTTON | Finish | /car-builder | ENABLEMENT_RULE => []')

# Next steps
## Next Steps
If you enjoyed this tutorial, why not try ordering another vehicle, but on your own?

## Want to do it again or show a friend?

## Want to get more techy?
We built this sample app on [IBM Blockchain Platform Develop]()