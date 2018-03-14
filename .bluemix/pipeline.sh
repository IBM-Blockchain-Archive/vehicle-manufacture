#!/bin/bash
trap 'detect_exit' 0 1 2 3 6

export IBP_NAME="ibm-blockchain-5-staging"
export IBP_PLAN="ibm-blockchain-plan-v1-starter-staging"
export VCAP_KEY_NAME="Credentials-1"
export APP_URL="unknown_yet"  # we correct this later
# export SERVICE_INSTANCE_NAME="blockchain-vehiclemanufacture-20180313102551270"
# export CF_APP="vehiclemanufacture-20180313102551270"
#export CLOUDANT_SERVICE_INSTANCE="vehiclemanufacture-20180308094355941"

detect_exit() {
    if [ "$COMPLETED_STEP" != "sample_up" ]; then
      printf "\n\n --- Uh oh something failed... ---\n"
      export COMPLETED_STEP="tc_error"
      if [ "$API_URL" != "" ]; then
        update_status
      fi
    else
      echo "Script completed successfully. =)"
    fi
}

update_status() {
    echo "Updating Deployment Status - ${NETWORK_ID}"
    echo '{"app": "'"$CF_APP"'", "url": "'"$APP_URL"'", "status": '$COMPLETED_STEP'}'
    echo curl -X PUT -s -S\
      "$API_HOST/api/v1/networks/$NETWORK_ID/sample/vehicle_manufacture" \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -u $USERID:$PASSWORD \
      -d '{"app": "'"$CF_APP"'", "url": "'"$APP_URL"'", "completed_step": "'"$COMPLETED_STEP"'"}' \
      | ./jq '.' || true
    curl -X PUT -s -S\
      "$API_HOST/api/v1/networks/$NETWORK_ID/sample/vehicle_manufacture" \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -u $USERID:$PASSWORD \
      -d '{"app": "'"$CF_APP"'", "url": "'"$APP_URL"'", "completed_step": "'"$COMPLETED_STEP"'"}' \
      | ./jq '.' || true
}

date
printf "\n ---- Install node and nvm ----- \n"
npm config delete prefix
     curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
     export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install --lts
nvm use node

node -v

date
printf "\n ---- Installed node and nvm ----- \n"

# -----------------------------------------------------------
# Detect if there is already a service we should use - [ Optional ]
# -----------------------------------------------------------
  printf "\n --- Detecting service options ---\n"
  if [ "$SERVICE_INSTANCE_NAME" != "" ]; then
    echo "A service instance name was provided, lets use that"
  else
    echo "A service instance name was NOT provided, lets use the default one"
    export SERVICE_INSTANCE_NAME="blockchain-${CF_APP}"
  fi
    printf "Using service instance name '${SERVICE_INSTANCE_NAME}'\n"

# -----------------------------------------------------------
# 1. Test if everything we need is set
# -----------------------------------------------------------
  printf "\n --- Testing if the script has what it needs ---\n"
  export SCRIPT_ERROR="nope"
  if [ "$IBP_NAME" == "" ]; then
    echo "Error - bad script setup - IBP_NAME was not provided (IBM Blockchain service name)"
    export SCRIPT_ERROR="yep"
  fi

  if [ "$IBP_PLAN" == "" ]; then
    echo "Error - bad script setup - IBP_PLAN was not provided (IBM Blockchain service's plan name)"
    export SCRIPT_ERROR="yep"
  fi

  if [ "$VCAP_KEY_NAME" == "" ]; then
    echo "Error - bad script setup - VCAP_KEY_NAME was not provided (Bluemix service credential key name)"
    export SCRIPT_ERROR="yep"
  fi

  if [ "$SERVICE_INSTANCE_NAME" == "" ]; then
    echo "Error - bad script setup - SERVICE_INSTANCE_NAME was not provided (IBM Blockchain service instance name)"
    export SCRIPT_ERROR="yep"
  fi

  if [ "$CF_APP" == "" ]; then
    echo "Error - bad script setup - CF_APP was not provided (Vehicle manufacture application name)"
    export SCRIPT_ERROR="yep"
  fi

  if [ "$SCRIPT_ERROR" == "yep" ]; then
    exit 1
  else
    echo "All good"
  fi

# -----------------------------------------------------------
# 2. Create a service instance (this is okay to run if the service name already exists as long as its the same typeof service)
# -----------------------------------------------------------
  date
  printf "\n --- Creating an instance of the IBM Blockchain Platform service ---\n"
  cf create-service ${IBP_NAME} ${IBP_PLAN} ${SERVICE_INSTANCE_NAME}

  #needed to ensure channels are created
  sleep 30s

  cf create-service-key ${SERVICE_INSTANCE_NAME} ${VCAP_KEY_NAME} -c '{"msp_id":"PeerOrg1"}'

  date
  printf "\n --- Creating an instance of the Cloud object store ---\n"
  cf create-service cloudantNoSQLDB Lite cloudant-${CF_APP}
  cf create-service-key cloudant-${CF_APP} ${VCAP_KEY_NAME}
  date
  printf "\n --- Created an instance of the Cloud object store ---\n"

# -----------------------------------------------------------
# 3. Get service credentials into our file system (remove the first two lines from cf service-key output)
# -----------------------------------------------------------
  date
  printf "\n --- Getting service credentials ---\n"
  cf service-key ${SERVICE_INSTANCE_NAME} ${VCAP_KEY_NAME} > ./config/temp.txt
  tail -n +2 ./config/temp.txt > ./config/vehicle_tc.json

  curl -o jq -L https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64
  chmod +x jq
  export PATH=$PATH:$PWD

  export NETWORKID=$(jq --raw-output '.org1."network_id"' ./config/vehicle_tc.json)
  printf "\n networkid ${NETWORKID} \n"

  export USERID=$(jq --raw-output '.org1.key' ./config/vehicle_tc.json)
  printf "\n userid ${USERID} \n"

  export PASSWORD=$(jq --raw-output '.org1.secret' ./config/vehicle_tc.json)
  printf "\n password ${PASSWORD} \n"

  export API_HOST=$(jq --raw-output '.org1.url' ./config/vehicle_tc.json)
  printf "\n apiurl ${API_HOST} \n"

  #cf service-key cloudant-${CLOUDANT_SERVICE_INSTANCE} ${VCAP_KEY_NAME} > ./config/cloudant-creds-temp.txt
  cf service-key cloudant-${CF_APP} ${VCAP_KEY_NAME} > ./config/cloudant-creds-temp.txt
  tail -n +2 ./config/cloudant-creds-temp.txt > ./config/cloudant-creds.txt

  cat ./config/cloudant-creds.txt

  export CLOUDANT_URL=$(jq --raw-output '.url' ./config/cloudant-creds.txt)

  echo curl -X PUT ${CLOUDANT_URL}/${CF_APP}
       curl -X PUT ${CLOUDANT_URL}/${CF_APP}

  export CLOUDANT_CREDS=$(jq ". + {database: \"${CF_APP}\"}" ./config/cloudant-creds.txt)

  printf "\n ${CLOUDANT_CREDS} \n"

  echo curl -X GET --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} ${API_HOST}/api/v1/networks/${NETWORKID}/connection_profile
       curl -X GET --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} ${API_HOST}/api/v1/networks/${NETWORKID}/connection_profile > ./config/connection-profile.json

  printf "\n --- connection-profile.json --- \n"
  cat ./config/connection-profile.json

  export SECRET=$(jq --raw-output 'limit(1;.certificateAuthorities[].registrar[0].enrollSecret)' ./config/connection-profile.json)
  printf "\n secret ${SECRET} \n"

  export MSPID=$(jq --raw-output 'limit(1; .organizations[].mspid)' ./config/connection-profile.json)
  printf "\n mspid ${MSPID} \n"

  export PEER=$(jq --raw-output 'limit(1; .organizations[].peers[0])' ./config/connection-profile.json)
  printf "\n peer ${PEER} \n"

  export CHANNEL="defaultchannel"

  export COMPLETED_STEP="received_creds"
  update_status

  date
  printf "\n --- Got service credentials ---\n"

# -----------------------------------------------------------
# 4. Install composer-cli
# -----------------------------------------------------------
  date
  printf "\n ---- Install composer-cli and composer-wallet-cloudant ----- \n "

  npm install -g composer-cli@0.18.1 @ampretia/composer-wallet-cloudant

  composer -v

  date
  printf "\n ---- Installed composer-cli and composer-wallet-cloudant ----- \n "

## -----------------------------------------------------------
## 5. Add and sync admin cert
## -----------------------------------------------------------
 date
 printf "\n ----- create ca card ----- \n"
 composer card create -f ca.card -p ./config/connection-profile.json -u admin -s ${SECRET}
 composer card import -f ca.card -n ca
 # request identity
 composer identity request --card ca --path ./credentials
 export PUBLIC_CERT=$(cat ./credentials/admin-pub.pem | tr '\n' '~' | sed 's/~/\\r\\n/g')

 # add admin cert
 date
 printf "\n ----- add certificate ----- \n"
 cat << EOF > request.json
{
"msp_id": "${MSPID}",
"peers": ["${PEER}"],
"adminCertName": "my cert",
"adminCertificate": "${PUBLIC_CERT}"
}
EOF

 cat request.json
 echo curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary @request.json ${API_HOST}/api/v1/networks/${NETWORKID}/certificates
      curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary @request.json ${API_HOST}/api/v1/networks/${NETWORKID}/certificates

 # stop peer
 date
 printf "\n ----- stop peer ----- \n"
 echo curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_HOST}/api/v1/networks/${NETWORKID}/nodes/${PEER}/stop
      curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_HOST}/api/v1/networks/${NETWORKID}/nodes/${PEER}/stop

 # start peer
 date
 printf "\n ----- start peer ----- \n"
 echo curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_HOST}/api/v1/networks/${NETWORKID}/nodes/${PEER}/start
      curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_HOST}/api/v1/networks/${NETWORKID}/nodes/${PEER}/start


 #wait for peer to start
 date
 printf "\n ----- wait for peer to start --- \n"

 export PEER_STATUS="not running"
 i=0

 while [[ "$PEER_STATUS" != "running" && "$i" -lt "12" ]]
   do
   sleep 10s
   echo curl -X GET --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} ${API_HOST}/api/v1/networks/${NETWORKID}/nodes/status
        STATUS=$(curl -X GET --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} ${API_HOST}/api/v1/networks/${NETWORKID}/nodes/status)
        PEER_STATUS=$(echo ${STATUS} | jq --raw-output ".[\"${PEER}\"].status")
   i=$[$i+1]
   done

# sync certificates
 date
 printf "\n ----- sync certificate ----- \n"
 echo curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_HOST}/api/v1/networks/${NETWORKID}/channels/${CHANNEL}/sync
      curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_HOST}/api/v1/networks/${NETWORKID}/channels/${CHANNEL}/sync

 date
 printf "\n ----- created ca card ----- \n"

## -----------------------------------------------------------
## 6. Create new card
## -----------------------------------------------------------
 date
 printf "\n ---- Create admin card ----- \n "
 composer card create -f adminCard.card -p ./config/connection-profile.json -u admin -c ./credentials/admin-pub.pem -k ./credentials/admin-priv.pem --role PeerAdmin --role ChannelAdmin

 composer card import -f adminCard.card -n adminCard
 date
 printf "\n ---- Created admin card ----- \n "

## -----------------------------------------------------------
## 7. Deploy the network
## -----------------------------------------------------------
 date
 printf "\n --- get network --- \n"
 #TODO make this not unstable
 npm install vehicle-manufacture-network@unstable
 date
 printf "\n --- got network --- \n"
 
 date
 printf "\n --- create archive --- \n"
 composer archive create -a ./vehicle-manufacture-network.bna -t dir -n node_modules/vehicle-manufacture-network
 date
 printf "\n --- created archive --- \n"
 
 date
 printf "\n --- install network --- \n"
 composer runtime install -c adminCard -n vehicle-manufacture-network
 date
 printf "\n --- installed network --- \n"

 export COMPLETED_STEP="installed_cc"
 update_status

 date
 printf "\n --- start network --- \n"

 while ! composer network start -c adminCard -a vehicle-manufacture-network.bna -A admin -C ./credentials/admin-pub.pem -f delete_me.card; do
   echo sleeping to retry network start
   sleep 30s
 done

 export COMPLETED_STEP="instantiated_cc"
 update_status

 date
 printf "\n --- started network --- \n"

# -----------------------------------------------------------
# Create Composer configuration for Cloudant wallet
# -----------------------------------------------------------
 date
 printf "\n --- create composer configuration --- \n"

  read -d '' NODE_CONFIG << EOF
{"composer":{"wallet":{"type":"@ampretia/composer-wallet-cloudant","desc":"Uses cloud wallet","options":${CLOUDANT_CREDS}}}}
EOF
  export NODE_CONFIG

 date
 printf "\n --- created composer configuration --- \n"

# -----------------------------------------------------------
# Import business network card into Cloudant wallet
# -----------------------------------------------------------
 date
 printf "\n --- import business network card --- \n"

 composer card create -n vehicle-manufacture-network -p ./config/connection-profile.json -u admin -c ./credentials/admin-pub.pem -k ./credentials/admin-priv.pem

 composer card import -f ./admin@vehicle-manufacture-network.card

 while ! composer network ping -c admin@vehicle-manufacture-network; do sleep 5; done

 date
 printf "\n --- imported business network card --- \n"

# -----------------------------------------------------------
# 8. Install Composer Playground
# -----------------------------------------------------------
  date
  printf "\n ---- Install composer-playground ----- \n"
  cf push composer-playground-${CF_APP} --docker-image sstone1/composer-playground:0.18.1 -i 1 -m 256M --no-start
  cf set-env composer-playground-${CF_APP} NODE_CONFIG "${NODE_CONFIG}"
  cf start composer-playground-${CF_APP}

  export PLAYGROUND_URL=$(cf app composer-playground-${CF_APP} | grep routes: | awk '{print $2}')
  date
  printf "\n ---- Installed composer-playground ----- \n"

# -----------------------------------------------------------
# 9. Install Composer Rest Server
# -----------------------------------------------------------
  date
  printf "\n----- Install REST server ----- \n"
  cf push composer-rest-server-${CF_APP} --docker-image sstone1/composer-rest-server:0.18.1 -c "composer-rest-server -c admin@vehicle-manufacture-network -n never -w true" -i 1 -m 256M --no-start
  cf set-env composer-rest-server-${CF_APP} NODE_CONFIG "${NODE_CONFIG}"
  cf start composer-rest-server-${CF_APP}

  export REST_SERVER_URL=$(cf app composer-rest-server-${CF_APP} | grep routes: | awk '{print $2}')
  date
  printf "\n----- Installed REST server ----- \n"

# -----------------------------------------------------------
# 10. Start the app
# -----------------------------------------------------------

#  # Push app (don't start yet, wait for binding)

  date
  printf "\n --- Creating the Vehicle manufacture application '${CF_APP}' ---\n"
  cf push ${CF_APP} --no-start -c "node server/app.js"
  cf set-env ${CF_APP} REST_SERVER_CONFIG "{\"webSocketURL\": \"wss://${REST_SERVER_URL}\", \"httpURL\": \"https://${REST_SERVER_URL}/api\"}"

  # Bind app to the blockchain service
  date
  printf "\n --- Binding the IBM Blockchain Platform service to Vehicle manufacture app ---\n"
  cf bind-service ${CF_APP} ${SERVICE_INSTANCE_NAME} -c "{\"permissions\":\"read-only\"}"

  # Start her up
  date
  printf "\n --- Starting vehicle manufacture app '${CF_APP}' ---\n"
  cf start ${CF_APP}
  export APP_URL=$(cf app ${CF_APP} | grep -Po "(?<=routes:)\s*\S*")

  date
  printf "\n --- Created the Vehicle manufacture application '${CF_APP}' ---\n"

# -----------------------------------------------------------
# 11. Ping IBP that the application is alive  - [ Optional ]
# -----------------------------------------------------------
  export COMPLETED_STEP="sample_up"
  update_status

  printf "\n\n --- We are done here. ---\n\n"