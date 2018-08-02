# Vehicle Manufacture Tutorial
This is the tutorial guide for the vehicle manufacture demo. The tutorial can be run as an application to help users run through the demo, providing information on what to do as well as why blockchain is useful for the task.
The tutorial instructions will run along side the demo once deployed, you can also view them [here](apps/vehicle-manufacture/tutorial.md)

[![Deploy to IBM Cloud](https://bluemix.net/deploy/button.png)](https://console.bluemix.net/devops/setup/deploy/?repository=https%3A//github.com/ibm-blockchain/vehicle-manufacture&branch=master&env_id=ibm%3Ayp%3Aus-south&deploy-region=ibm%3Ayp%3Aus-south)

## Manually deploy this demo to IBM Cloud

### 1. Setup your machine
Install the composer command line tools:

```
npm install -g composer-cli@0.19.5
```

Install the cloud wallet package:

```
npm install -g @ampretia/composer-wallet-cloudant@0.2.1
```

Install the [cloud foundry CLI](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html)

Clone this repository:

```
git clone https://github.com/IBM-Blockchain/vehicle-manufacture.git
```

Create the BNA:

```
cd vehicle-manufacture
mkdir contracts/dist
composer archive create -t dir -n contracts/vehicle-manufacture-network -a contracts/dist/vehicle-manufacture-network.bna
```

### 2. Create a Blockchain Service

Create a new Blockchain service in your IBM Cloud space ([link](https://console.bluemix.net/catalog/services/blockchain)). Give your service a  name, select 'Starter Membership Plan' for the pricing and then press **Create**. You should then be taken to the dashboard for your service.

![Create blockchain service screenshot](media/create-blockchain-service.png)

### 3. Configure certificates

In your blockchain service dashboard press the **Launch** button. Use the nav bar on the left to open the 'Channels' page and confirm that your peer is in the default channel. If it is not, add it manually by using the three dots in the actions column.

![Channel page](media/check-channel.png)

Change to the 'Overview' page and press the **Connection Profile** button and in the popup press **Download**. Rename your file to `connection-profile.json` and move it to the `contracts/dist` folder in your cloned copy of this repository.
Open your `connection-profile.json` file and scroll to the bottom. In the `registrar` field there is an `enrollSecret` property. This will be needed in future commands so make a note of it.

Use the enrollSecret you retrieved above to create a certificate authority (CA) card:

```
composer card create -f ca.card -p contracts/dist/connection-profile.json -u admin -s <ENROLL_SECRET>
```

Import your CA card:

```
composer card import -f ca.card -c ca
```

Exchange the enrollSecret for valid certificates from the CA.:

```
composer identity request --card ca --path ./credentials -u admin -s <ENROLL_SECRET>
```

The above command will generate a credentials directory where you run the command containing the certificate files.

Add these certificate files to your starter plan instance by opening the 'Members' page in the blockchain service UI and then pressing the certificates tab . Press **Add Certificate** and enter a name in the popup. Copy the contents of `credentials/admin-pub.pem` to your clipboard and paste in the certificate textbox of the popup.

![Channel page](media/add-admin-cert.png)

Press **Submit** and then **Restart**. Restarting the peer may take several minutes.

Finally sync the certificates to the channel by opening the 'Channels' page and in the default channel press the three dots in the actions column to open the menu. Click **Sync Certificate** and then **Submit** in the popup.
### 4. Install and start the network

> Note: Ensure that your terminal is in the cloned repository folder.

Create a card with channel and peer admin roles:

```
composer card create -f adminCard.card -p ./contracts/dist/connection-profile.json -u admin -c ./credentials/admin-pub.pem -k ./credentials/admin-priv.pem --role PeerAdmin --role ChannelAdmin
```

Import the admin card:

```
composer card import -f adminCard.card -c adminCard
```

Install the network:

```
composer network install -c adminCard -a ./contracts/dist/vehicle-manufacture-network.bna
```

Start the network:

```
composer network start -c adminCard -n vehicle-manufacture-network -V 0.2.5 -A admin -C ./credentials/admin-pub.pem -f delete_me.card
```

If this command fails you may need to try again.

>Note: Ensure that the version used in the command above matches that in the output of the install command.

Delete the card created by starting the network:

```
rm delete_me.card
```

Create a new card that references the certificates retrieved earlier:

```
composer card create -n vehicle-manufacture-network -p ./contracts/dist/connection-profile.json -u admin -c ./credentials/admin-pub.pem -k ./credentials/admin-priv.pem
```

Import the new card using:

```
composer card import -f ./admin@vehicle-manufacture-network.card
```

Use ping to check that the network has deployed:

```
composer network ping -c admin@vehicle-manufacture-network
```

### 5. Provision Cloudant

Create a new Cloudant service in the same space as your blockchain service ([link](https://console.bluemix.net/catalog/services/cloudantNoSQLDB)). Give your service a name, select 'Lite' for the plan and then press **Create**. you should then be taken to the Cloudant dashboard.

![Create cloudant service screenshot](media/create-cloudant-service.png)

In the Cloudant dashboard use the left navigation bar to go to the 'Service credentials page'. Press **New credential** then press **Add** in the popup leaving the name as Credentials-1.

Create a new file called `cloudant.json` in your vehicle-manufacture directory and paste the following JSON into it:

```
{
    "composer": {
        "wallet": {
            "type": "@ampretia/composer-wallet-cloudant",
            "options": {}
        }
    }
}
```

Get the JSON data of your credentials by clicking **View credentials** on the Credentials-1 row of the 'Service credentials page'. Replace the data in the options field of your `cloudant.json` file with this JSON adding an additional field to the copied JSON with the value "database": "wallet". Your file should look something like this:

```
{
    "composer": {
        "wallet": {
            "type": "@ampretia/composer-wallet-cloudant",
            "options": {
               "host": "XXXXXXXX-XXXX-XXXX-XXXXXXXXXXXX-bluemix.cloudant.com",
                "password": "***********",
                "port": 443,
                "url": "https://XXXXXXXX-XXXX-XXXX-XXXXXXXXXXXX-bluemix:***********@XXXXXXXX-XXXX-XXXX-XXXXXXXXXXXX-bluemix.cloudant.com",
                "username": "XXXXXXXX-XXXX-XXXX-XXXXXXXXXXXX-bluemix",
                "database": "wallet"
            }
        }
    }
}
```

Create the Cloudant database using the value in the JSON for the url field:

```
curl -X PUT <CLOUDANT_URL>/wallet
```

Set the NODE_CONFIG environment variable on your machine using the contents of your `cloudant.json` file with new lines removed:

```
export NODE_CONFIG=$(awk -v RS= '{$1=$1}1' < cloudant.json)
```

>Note: You will need to remove the line breaks before using the file data to replace <CLOUDANT_CREDENTIALS>.

Import the admin card to the Cloudant service:

```
composer card import -f ./admin@vehicle-manufacture-network.card
```

### 6. Deploy the applications

Log in to Cloud Foundry and select the space you deployed your Blockchain service to:
```
cf login
```

>Note: If you use single sign-on you will need to use the `--sso` option with the above command.

#### REST Server

Push the REST server using the docker image:

```
cf push vehicle-manufacture-rest --docker-image ibmblockchain/composer-rest-server:0.19.5 -i 1 -m 256M --no-start --no-manifest --random-route
```

Set the NODE_CONFIG environment variable for the REST server:

```
cf set-env vehicle-manufacture-rest NODE_CONFIG "$NODE_CONFIG"
```

Set the other environment variables for the REST server:

```
cf set-env vehicle-manufacture-rest COMPOSER_CARD admin@vehicle-manufacture-network
cf set-env vehicle-manufacture-rest COMPOSER_NAMESPACES required
cf set-env vehicle-manufacture-rest COMPOSER_WEBSOCKETS true
```

#### Playground

Push playground using the docker image:

```
cf push vehicle-manufacture-playground --docker-image ibmblockchain/composer-playground:0.19.5 -i 1 -m 256M --no-start --random-route --no-manifest
```

Set the NODE_CONFIG environment variable for the playground using the contents of your `cloudant.json` file:

```
cf set-env vehicle-manufacture-playground NODE_CONFIG "$NODE_CONFIG"
```

#### Vehicle manufacture application

Push the application using the files in your clone of this repository:

```
cf push vehicle-manufacture -f ./apps/vehicle-manufacture/manifest.yml -i 1 -m 128M --random-route --no-start
```

Bind the blockchain service to the vehicle manufacture application using the name of your blockchain service:

```
cf bind-service vehicle-manufacture <BLOCKCHAIN_SERVICE_NAME> -c '{"permissions":"read-only"}'
```

Set the environment variable used to tell the vehicle manufacture application where to send requests. To do this you will need to get the REST server's URL. This can be retrieved by in your IBM Cloud dashboard clicking 'vehicle-manufacture-rest' and then using the routes dropdown at the top right of the page. The URL is then a combination of the two textboxes in the popup (e.g. vehicle-manufacture-rest-undichotomous-fresser.mybluemix.net).

![Get route screenshot](media/get-route-screenshot.png)

Use this command to set the environment variable replacing <REST_SERVER_URL> with the URL retrieved above:

```
cf set-env vehicle-manufacture REST_SERVER_URLS '{"vehicle-manufacture-rest": {"httpURL": "https://<REST_SERVER_URL>/api", "webSocketURL": "wss://<REST_SERVER_URL>"}}'
```

Set the environment variable used to tell the vehicle manufacture application where the playground is located. to do this retrieve the playground URL using the method described above but for the playground application and then use the following command replacing <PLAYGROUND_URL> with the URL retrieved:

```
cf set-env vehicle-manufacture PLAYGROUND_URL 'https://<PLAYGROUND_URL>'
```

### 7. Start the applications

Start the REST server:

```
cf start vehicle-manufacture-rest
```

Start the playground:

```
cf start vehicle-manufacture-playground
```

Start the vehicle manufacture application:

```
cf start vehicle-manufacture
```

You can now run the tutorial by clicking vehicle-manufacture in your IBM Cloud dashboard and then clicking **Visit app URL**.

# Potential Errors
## Car Builder - Place Order >  Error Occurred
In the home screen of the car builder press the cog icon. Check that the URLs for the REST server are set to the route of your REST server in IBM Cloud. The HTTP URL should be https://<YOUR_ROUTE>/api and the Web Socket URL wss://<YOUR_ROUTE>.

If you have pressed the **Update** button before, the settings used by the car builder will come from cookies stored in your browser. These settings will overwrite the REST server settings recorded in the environment variables for the vehicle manufacture app. Entering the correct REST URL and pressing **Update** will update this cookie and should fix the error, alternatively to use the environment variable value in the developer console enter `localStorage.clear()`.
