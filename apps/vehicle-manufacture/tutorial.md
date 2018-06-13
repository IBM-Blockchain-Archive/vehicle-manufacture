# Building your car
## Step 1
[//]: # ('LISTENER | ATTRIBUTE | | .tutorial-button | disabled')

Order your vehicle. Click 'Design your car' then select the model you'd like. Select the trim, colour, interior, and extras.

When you're finished click 'Place order'.

[//]: # ('NOTIFICATION | Hello! | Click on the 'Add' icon to bring up the tutorial and begin the demo. | TOP | LEFT | CREATE_WHEN => [ LISTENER | SCOPE | EQUAL | mode | tutorial | OR => [ LISTENER | EVENT | | #reset | click ]] | DESTROY_WHEN => [ LISTENER | EVENT | | #expandContract |  click ]')
[//]: # ('NOTIFICATION |  | If you would like to reset the tutorial and start again at any point, click the icon in the upper right. | TOP | RIGHT | CREATE_WHEN => [ LISTENER | SCOPE | EQUAL | mode | tutorial | OR => [ LISTENER | EVENT | | #reset | click ]] | DESTROY_WHEN => [ LISTENER | EVENT | | #reset |  click ]')

[//]: # ('NOTIFICATION |  | You are now Paul, a consumer interested in ordering a car through the Arium app.  | TOP | LEFT | CREATE_WHEN => [ LISTENER | EVENT | | #expandContract |  click ] | DESTROY_WHEN => []')

[//]: # ('BUTTON | Next Step | /manufacturer-dashboard | ENABLEMENT_RULE => [ REST_EVENT | $class | EQUAL | org.acme.vehicle_network.PlaceOrderEvent]')

# Manufacturing the car
## Step 2
[//]: # ('LISTENER | ATTRIBUTE | | .tutorial-button | disabled')

To start the manufacturing process click the ‘Start manufacture’ button.

[//]: # ('NOTIFICATION | | You are now Mike, the Manufacturing Manager at Arium Logistics. Notice, a new order has been recieved. | TOP | RIGHT | CREATE_WHEN => [] | DESTROY_WHEN => []')

[//]: # ('NOTIFICATION | | As the vehicle is assembled, components like the chassis and interior will be built or installed, and the blockchain assets will be updated. Finally, the vehicle identification number, VIN, can be automatically assigned in accordance with a smart contract, without manual regulator approval, retaining regulatory oversight. | TOP | LEFT | CREATE_WHEN => [ LISTENER | EVENT | manufacturer | .start-manufacture | click ] | DESTROY_WHEN => []')

[//]: # ('BUTTON | Next Step | /regulator-dashboard | ENABLEMENT_RULE => [ REST_EVENT | $class | EQUAL | org.acme.vehicle_network.UpdateOrderStatusEvent | AND => [ REST_EVENT | orderStatus | EQUAL | DELIVERED ]]')

# Regulating the network
## Step 3
In the regulator view, you can see all the transactions that have occured in the network. By viewing the table at the bottom you can see that the actions you have taken in this tutorial have been recorded on the blockchain.

[//]: # ('NOTIFICATION | | You are now Debbie, the VDA Officer at Vehicle & Drivers Authority. You regulate car manufacture using a web-based application that allows you to view the full list of transactions recorded on the blockchain. | TOP | RIGHT | CREATE_WHEN => [] | DESTROY_WHEN => []')

[//]: # ('BUTTON | Next Step | /car-builder | ENABLEMENT_RULE => []')

# Reviewing the purchase
## Step 4
Paul is kept up to date with the status of his order using the Arium mobile application.

[//]: # ('BUTTON | Finish | /car-builder | ENABLEMENT_RULE => []')

# Next steps
## Next Steps
If you enjoyed this tutorial, why not try ordering another vehicle, but on your own?

[//]: # ('INLINE_BUTTON | Order another | FUNCTION => [ startAgain | ARGS => [] ]')

## Want to do it again or show a friend?

[//]: # ('INLINE_BUTTON | Reset tutorial | FUNCTION => [ reset | ARGS => [] ]')

## Want to go more in-depth?
This sample was built using [IBM Blockchain Platform: Develop](https://console.bluemix.net/docs/services/blockchain/develop.html#develop-the-network). Check out the model and business logic behind this sample [here](%PLAYGROUND_URL%), or browse the generated REST APIs [here](%REST_SERVER_URL%).