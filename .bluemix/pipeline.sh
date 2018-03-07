#!/bin/bash
trap 'detect_exit' 0 1 2 3 6

export IBP_NAME="ibm-blockchain-5-dev"
export IBP_PLAN="ibm-blockchain-plan-v1-starter-dev"
export VCAP_KEY_NAME="Credentials-1"
export APP_URL="unknown_yet"  # we correct this later

env

detect_exit() {
    if [ "$DEPLOY_STATUS" != "sample_up" ]; then
      printf "\n\n --- Uh oh something failed... ---\n"
      export DEPLOY_STATUS="tc_error"
      if [ "$API_URL" != "" ]; then
        update_status
      fi
    else
      echo "Script completed successfully. =)"
    fi
}

update_status() {
    echo "Updating Deployment Status"
    echo "$API_URL/api/v1/networks/$NETWORKID/sample/marbles"   #dsh remove this
    echo '{"app": "'"$CF_APP"'", "url": "'"$APP_URL"'", "status": "'"$DEPLOY_STATUS"'"}'
    curl -X PUT -s -S\
      "$API_URL/api/v1/networks/$NETWORKID/sample/vehiclemanufacture" \
      -H 'Cache-Control: no-cache' \
      -H 'Content-Type: application/json' \
      -u $USERID:$PASSWORD \
      -d '{"app": "'"$CF_APP"'", "url": "'"$APP_URL"'", "status": "'"$DEPLOY_STATUS"'"}' \
      | jq '.' || true
}

printf "\n ---- Install node and nvm ----- \n"
npm config delete prefix
     curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
     export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install --lts
nvm use node

    node -v

# -----------------------------------------------------------
# Detect if there is already a service we should use - [ Optional ]
# -----------------------------------------------------------
  printf "\n --- Detecting service options ---\n"
  if [ "$SERVICE_INSTANCE_NAME" != "" ]; then
    echo "A service instance name was provided, lets use that"
  else
    echo "A service instance name was NOT provided, lets use the default one"
    export SERVICE_INSTANCE_NAME="Blockchain-${CF_APP}"
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
  printf "\n --- Creating an instance of the IBM Blockchain Platform service ---\n"
  cf create-service ${IBP_NAME} ${IBP_PLAN} ${SERVICE_INSTANCE_NAME}
  cf create-service-key ${SERVICE_INSTANCE_NAME} ${VCAP_KEY_NAME} -c '{"msp_id":"PeerOrg1"}'

#  printf "\n --- Creating an instance of the Cloud object store ---\n"
  cf create-service cloudantNoSQLDB Lite cloudant-${CF_APP}
  cf create-service-key cloudant-${CF_APP} ${VCAP_KEY_NAME}
#  bx api ${CF_TARGET_URL}
#
#  cf create-service cloud-object-storage Lite storage-${CF_APP}
#  cf create-service-key storage-${CF_APP} ${VCAP_KEY_NAME}
#
#  bx iam oauth-tokens > tokens.txt
#
#  cat tokens.txt
#
#  curl -X "PUT" "https://s3.us-south.objectstorage.softlayer.net/bucket-${SERVICE_INSTANCE_NAME}" \
#       -H "Authorization: Bearer <token>" \
#       -H "ibm-service-instance-id: storage-${SERVICE_INSTANCE_NAME}"


# -----------------------------------------------------------
# 3. Get service credentials into our file system (remove the first two lines from cf service-key output)
# -----------------------------------------------------------
  printf "\n --- Getting service credentials ---\n"
  cf service-key ${SERVICE_INSTANCE_NAME} ${VCAP_KEY_NAME} > ./config/temp.txt
  tail -n +2 ./config/temp.txt > ./config/vehicle_tc.json

  curl -o jq -L https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64
  chmod +x jq
  export PATH=$PATH:$PWD

  cf service-key cloudant-${CF_APP} ${VCAP_KEY_NAME} > ./config/cloudant-creds-temp.txt
  tail -n +1 ./config/cloudant-creds-temp.txt > ./config/cloudant-creds.txt

  cat ./config/cloudant-creds.txt

  export CLOUDANT_CREDS=$(jq --raw-output '.' ./config/cloudant-creds.txt)

  printf "\n ${CLOUDANT_CREDS} \n"

  printf "\n ---- CAZ BANANA ---- \n"
  cat ./config/vehicle_tc.json

  jq --raw-output '.credentials[0].channels.defaultchannel.chaincodes = [] | .credentials[0]' ./config/vehicle_tc.json > ./config/connection-profile.json

  printf "\n --- connection-profile.json --- \n"
  cat ./config/connection-profile.json

  export SECRET=$(jq --raw-output 'limit(1;.certificateAuthorities[].registrar[0].enrollSecret)' ./config/connection-profile.json)
  printf "\n secret ${SECRET} \n"

  export NETWORKID=$(jq --raw-output '."x-networkId"' ./config/connection-profile.json)
  printf "\n networkid ${NETWORKID} \n"

  export USERID=$(jq --raw-output '."x-api".key' ./config/connection-profile.json)
  printf "\n userid ${USERID} \n"

  export PASSWORD=$(jq --raw-output '."x-api".secret' ./config/connection-profile.json)
  printf "\n password ${PASSWORD} \n"

  export API_URL=$(jq --raw-output '."x-api".url' ./config/connection-profile.json)
  printf "\n apiurl ${API_URL} \n"

  export MSPID=$(jq --raw-output 'limit(1; .organizations[].mspid)' ./config/connection-profile.json)
  printf "\n mspid ${MSPID} \n"

  export PEER=$(jq --raw-output 'limit(1; .organizations[].peers[0])' ./config/connection-profile.json)
  printf "\n peer ${PEER} \n"

  export CHANNEL="defaultchannel"

  export DEPLOY_STATUS="received_creds"
  update_status



# -----------------------------------------------------------
# 4. Install composer-cli
# -----------------------------------------------------------
  printf "\n ---- Install composer-cli ----- \n "

  npm install -g composer-cli@next

  composer -v

  printf "\n ----- create ca card ----- \n"
  composer card create -f ca.card -p ./config/connection-profile.json -u admin -s ${SECRET}
  composer card import -f ca.card -n ca

# -----------------------------------------------------------
# 5. Add and sync admin cert
# -----------------------------------------------------------
  # request identity
  composer identity request --card ca --path ./credentials
  export PUBLIC_CERT=$(cat ./credentials/admin-pub.pem | tr '\n' '~' | sed 's/~/\\r\\n/g')

  # add admin cert
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
#  echo curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary @request.json ${API_URL}/api/v1/networks/${NETWORKID}/certificates
#       curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary @request.json ${API_URL}/api/v1/networks/${NETWORKID}/certificates

#  # sync certificates
#  printf "\n ----- sync certificate ----- \n"
#  echo curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_URL}/api/v1/networks/${NETWORKID}/channels/${CHANNEL}/sync
#       curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_URL}/api/v1/networks/${NETWORKID}/channels/${CHANNEL}/sync
#
#  # stop peer
#  printf "\n ----- stop peer ----- \n"
#  echo curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_URL}/api/v1/networks/${NETWORKID}/nodes/${PEER}/stop
#       curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_URL}/api/v1/networks/${NETWORKID}/nodes/${PEER}/stop
#
#  # start peer
#  printf "\n ----- start peer ----- \n"
#  echo curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_URL}/api/v1/networks/${NETWORKID}/nodes/${PEER}/start
#       curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --basic --user ${USERID}:${PASSWORD} --data-binary '{}' ${API_URL}/api/v1/networks/${NETWORKID}/nodes/${PEER}/start

# -----------------------------------------------------------
# 6. Create new card
# -----------------------------------------------------------
  printf "\n ---- Create admin card ----- \n "
  composer card create -f adminCard.card -p ./config/connection-profile.json -u admin -c ./credentials/admin-pub.pem -k ./credentials/admin-priv.pem --role PeerAdmin --role ChannelAdmin

  composer card import -f adminCard.card -n adminCard

# -----------------------------------------------------------
# 7. Deploy the network
# -----------------------------------------------------------
  printf "\n --- get network --- \n"
  npm install vehicle-manufacture-network

  printf "\n --- create archive --- \n"
  composer archive create -a ./vehicle-manufacture-network.bna -t dir -n node_modules/vehicle-manufacture-network

  printf "\n --- install network --- \n"
  composer runtime install -c adminCard -n vehicle-manufacture-network

  export DEPLOY_STATUS="installed_cc"
  update_status

  printf "\n --- start network --- \n"
  composer network start -c adminCard -a vehicle-manufacture-network.bna -A admin -C ./credentials/admin-pub.pem -f delete_me.card

  composer card delete -n admin@vehicle-manufacture-network

  composer card create -n vehicle-manufacture-network -p ./config/connection-profile.json -u admin -c ./credentials/admin-pub.pem -k ./credentials/admin-priv.pem

  composer card import -f ./admin@vehicle-manufacture-network.card

  export DEPLOY_STATUS="instantiated_cc"
  update_status

## -----------------------------------------------------------
## 8. Install Composer Playground
## -----------------------------------------------------------
#  printf "\n ---- Install composer-playground ----- \n"
#  npm install composer-playground@next
#
#  cd node_modules/composer-playground
#
#  cf push composer-playground-${CF_APP} -c "node cli.js" -i 1 -m 128M --no-start
#  cf set-env composer-playground-${CF_APP} COMPOSER_CONFIG '{"webonly":true}'
#  cf start composer-playground-${CF_APP}

## -----------------------------------------------------------
## 9. Install Composer Rest Server
## -----------------------------------------------------------
#  printf "\n----- Install REST server ----- \n"
#  cd ../..
#  npm install composer-rest-server@next
#  cd node_modules/composer-rest-server
#  cf push composer-rest-server-${CF_APP} -c "node cli.js -c admin@vehicle-manufacture-network -n always -w true" -i 1 -m 256M --no-start
#  cf start composer-rest-server-${CF_APP}
#  cd ../..
#
## -----------------------------------------------------------
## 10. Start the app
## -----------------------------------------------------------
#
#  # Push app (don't start yet, wait for binding)
#  printf "\n --- Creating the Vehicle manufacture application '${CF_APP}' ---\n"
#  cf push ${CF_APP} --no-start
#  cf set-env ${CF_APP} REST_SERVER_CONFIG "{\"webSocketURL\": \"ws://composer-rest-server-${CF_APP}\", \"httpURL\": \"composer-rest-server-${CF_APP}/api\"}"
#
#  # Bind app to the blockchain service
#  printf "\n --- Binding the IBM Blockchain Platform service to Vehicle manufacture app ---\n"
#  cf bind-service ${CF_APP} ${SERVICE_INSTANCE_NAME} -c "{\"permissions\":\"read-only\"}"
#
#  # Start her up
#  printf "\n --- Starting vehicle manufacture app '${CF_APP}' ---\n"
#  cf start ${CF_APP}
#  export APP_URL=$(cf app $CF_APP | grep -Po "(?<=routes:)\s*\S*")
#
## -----------------------------------------------------------
## 11. Ping IBP that the application is alive  - [ Optional ]
## -----------------------------------------------------------
#  export DEPLOY_STATUS="sample_up"
#  update_status
#
#  printf "\n\n --- We are done here. ---\n\n"