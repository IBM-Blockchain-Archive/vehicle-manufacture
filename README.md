# Vehicle Manufacture Tutorial

This is the tutorial guide for the vehicle manufacture demo. The tutorial can be run as an application to help users run through the demo, providing information on what to do as well as why blockchain is useful for the task.

The tutorial instructions will run along side the demo once deployed, you can also view them (here)[apps/tutorial.md]

[![Deploy to IBM Cloud](https://bluemix.net/deploy/button.png)](https://console.bluemix.net/devops/setup/deploy/?repository=https%3A//github.com/ibm-blockchain/vehicle-manufacture&branch=master&env_id=ibm%3Ayp%3Aus-south&deploy-region=ibm%3Ayp%3Aus-south)

# Potential Errors
## Car Builder - Place Order >  Error Occurred
In the home screen of the car builder press the cog icon. Check that the URLs for the REST server are set to the route of your REST server in bluemix. The HTTP URL should be https://<YOUR_ROUTE>/api and the Web Socket URL wss://<YOUR_ROUTE>.

If you have pressed the "Update" button before the settings used by the car builder will be come from cookies stored in your browser and these will overwrite the REST server settings recorded in the environment variables for the vehicle manufacture app. Entering the correct REST URL and pressing "Update" will update this cookie and should fix the error. Alternatively to fallback on the environment variable value in the developer console enter `localStorage.clear()`.