# WARNING: This repository is no longer maintained :warning:

> This repository will not be updated. The repository will be kept available in read-only mode.

# Vehicle Manufacture with Blockchain
Imagine you are a car manufacturer, and have just made your most desired concept car a reality for the public. Hundreds of thousands of orders are pouring in and you need a way to manage the manufacturing and assembly process of these orders in an automated fashion. Moreover, you need keep a record of all of the company's business dealings to ensure that they conform to the regulator's standards and you are prepared for auditing. Blockchain means that these regulatory rules are embodied by code in a smart contract and thus a company can ensure that by recording these dealings using that smart contract in the blockchain, they are meeting the requirements laid out and the blockchain provides a full record for audit.

In this code pattern, we will create a vehicle manufacturing program with blockchain using Hyperledger Composer, and demonstrate it through a Node.js web application. The application showcases the scenario of buying and manufacturing a vehicle.

It has three dashboards. One for the vehicle buyer, where they can view the catalog of vehicles, personalize their selection and make the purchase. The second dashboard view is for the manufacturer where they can see the car purchase requests made, track the process of the car manufacture and verify delivery status details. The third dashboard is for vehicle regulatory officer where they regulate car manufacture and can view the full list of transactions recorded on the blockchain.

As the vehicle is assembled, components like the chassis and interior will be built or installed, and the blockchain assets will be updated. Finally, the vehicle identification number, VIN, can be automatically assigned in accordance with a smart contract, without manual regulator approval, retaining regulatory oversight.

This code pattern is for developers looking to start building blockchain applications with Hyperledger Composer. When the reader has completed this code pattern, they will understand how to:
* Create basic business network using Hyperledger Composer
* Deploy the network to IBM Blockchain Starter Plan manually
* Build a Node.js web application to interact with the blockchain network using Composer

The tutorial instructions will run along side the demo once deployed, you can also view them [here](apps/vehicle-manufacture/tutorial.md)

# Architecture Flow
![Architecture Flow](docs/doc-images/arch-flow.png?raw=true)

1. The buyer of the vehicle views the catalog of cars on his dashboard.
2. They personalize the vehicle by selecting model, exterior and interior options and other packages/add-ons available withthe vehicle.
3. They submit the order.
4. The order is received by the manufacturer on their dashboard where they view the progress of the assembly of the vehicle and the shipment status.
5. The vehicle regulatory views and tracks all details and changes with respect to the order on the blockchain, allowing maximum transparency.

# Included Components
* [Hyperledger Composer v0.20.3](https://hyperledger.github.io/composer/latest/) Hyperledger Composer is an extensive, open development toolset and framework to make developing blockchain applications easier
* [Hyperledger Fabric v1.2](https://hyperledger-fabric.readthedocs.io) Hyperledger Fabric is a platform for distributed ledger solutions, underpinned by a modular architecture delivering high degrees of confidentiality, resiliency, flexibility and scalability.
* [IBM Blockchain Starter Plan](https://console.bluemix.net/catalog/services/blockchain) The IBM Blockchain Platform Starter Plan allows to build and try out blockchain network in an environment designed for development and testing

## Featured Technologies
* [Nodejs](https://www.python.org/) Node.js is an open-source, cross-platform JavaScript run-time environment that executes JavaScript code server-side

# Running the Application
Use the ``Deploy to IBM Cloud`` button **OR** manually deploy to IBM Cloud.

## Directly deploy to IBM Cloud
[![Deploy to IBM Cloud](https://bluemix.net/deploy/button.png)](https://console.bluemix.net/devops/setup/deploy/?repository=https%3A//github.com/ibm-blockchain/vehicle-manufacture&branch=master&env_id=ibm%3Ayp%3Aus-south&deploy-region=ibm%3Ayp%3Aus-south)

## Manually deploy to IBM Cloud
1. [Setup your machine](#1-setup-your-machine)
2. [Clone the repository](#2-clone-the-repository)
3. [Create the BNA File](#3-create-the-bna-file)
4. [Create a Blockchain Service](#4-create-a-blockchain-service)
5. [Configure certificates](#5-configure-certificates)
6. [Install and start the network](#6-install-and-start-the-network)
7. [Provision Cloudant](#7-provision-cloudant)
8. [Deploy the applications](#8-deploy-the-applications)
9. [Start the applications](#9-start-the-applications)

### 1. Setup your machine
- [npm](https://www.npmjs.com/)  (v5.x)
- [Node](https://nodejs.org/en/) (version 8.9 or higher - note version 9 is not supported)
* to install specific Node version you can use [nvm](https://hyperledger.github.io/composer/latest/installing/installing-prereqs.html)

  Example:
  + 1. `nvm install --lts`
  + 2. `nvm use --lts`
  + 3. Output `Now using node v8.11.3 (npm v5.6.0)`
- [Hyperledger Composer](https://hyperledger.github.io/composer/installing/development-tools.html)
  * to install composer cli
    `npm install -g composer-cli@0.20.3`
- [Cloud Wallet Package](https://www.npmjs.com/package/composer-wallet-cloudant)
  * `npm install -g composer-wallet-cloudant@0.0.13`
- [Cloud Foundry CLI](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html)
  * for Mac OS X Installation
    ```
    brew tap cloudfoundry/tap
    brew install cf-cli
    ```
  * for Linux (Debian and Ubuntu based) Installation
    ```
    wget -q -O - https://packages.cloudfoundry.org/debian/cli.cloudfoundry.org.key | sudo apt-key add -
    echo "deb https://packages.cloudfoundry.org/debian stable main" | sudo tee /etc/apt/sources.list.d/cloudfoundry-cli.list
    sudo apt-get update
    sudo apt-get install cf-cli
    ```

### 2. Clone the repository

```
git clone https://github.com/IBM-Blockchain/vehicle-manufacture.git
```

### 3. Create the BNA File

```
cd vehicle-manufacture
mkdir contracts/dist
composer archive create -t dir -n contracts/vehicle-manufacture-network -a contracts/dist/vehicle-manufacture-network.bna
```

### 4. Create a Blockchain Service

Create a new Blockchain service in your IBM Cloud space ([link](https://console.bluemix.net/catalog/services/blockchain)). Give your service a  name, select 'Starter Membership Plan' for the pricing and then press **Create**. You should then be taken to the dashboard for your service.

![Create blockchain service screenshot](media/create-blockchain-service.png)

### 5. Configure certificates

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

### 6. Install and start the network

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

![network ping](media/network-ping.png)

Congrats, you've configured your blockchain network!

### 7. Provision Cloudant

Create a new Cloudant service in the same space as your blockchain service ([link](https://console.bluemix.net/catalog/services/cloudantNoSQLDB)). Give your service a name, select 'Lite' for the plan and then press **Create**. you should then be taken to the Cloudant dashboard.

![Create cloudant service screenshot](media/create-cloudant-service.png)

In the Cloudant dashboard use the left navigation bar to go to the 'Service credentials page'. Press **New credential** then press **Add** in the popup leaving the name as Credentials-1.

Create a new file called `cloudant.json` in your vehicle-manufacture directory and paste the following JSON into it:

```
{
    "composer": {
        "wallet": {
            "type": "composer-wallet-cloudant",
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
            "type": "composer-wallet-cloudant",
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

### 8. Deploy the applications

Log in to Cloud Foundry and select the space you deployed your Blockchain service to:
```
cf login
```

>Note: If you use single sign-on you will need to use the `--sso` option with the above command.

#### REST Server

Push the REST server using the docker image:

```
cf push vehicle-manufacture-rest --docker-image hyperledger/composer-rest-server:0.20.3 -i 1 -m 256M --no-start --no-manifest --random-route
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
cf push vehicle-manufacture-playground --docker-image hyperledger/composer-playground:0.20.3 -i 1 -m 256M --no-start --random-route --no-manifest
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

### 9. Start the applications

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
