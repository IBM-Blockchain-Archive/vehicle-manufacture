
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var expressLess = require('express-less');
var cfenv = require('cfenv');
var WebSocket = require('ws');
var http = require('http');
var url = require('url');
var config = require('config');
var fs = require('fs');
var favicon = require('serve-favicon');

var TutorialParser = require(__dirname+'/utils/tutorialParser');

// create a new express server
var app = express();
var server = http.createServer(app);

app.use(bodyParser.json());
app.use(favicon(path.join(__dirname, '..', 'public', 'icon', 'favicon.ico')));

// static - all our js, css, images, etc go into the assets path
app.use('/app', express.static(path.join(__dirname, '../client', 'app')));
app.use('/bower_components', express.static(path.join(__dirname, '../client', 'bower_components')));
app.use('/assets', express.static(path.join(__dirname, '../client', 'assets')));
app.use('/data', express.static(path.join(__dirname, '../client', 'data')));
app.use('/custom-application-styles', express.static(path.join(__dirname, '/demo-applications', 'style')));

app.use('/less/stylesheets/*', function (req, res, next) {
  var url = req.originalUrl;
  var relativePath = url.replace('less/stylesheets/', '');
  var lessCSSFile = path.join('../client', relativePath);
  req.url = lessCSSFile;
  var expressLessObj = expressLess(__dirname, {
    compress: true,
    debug: true
  });
  expressLessObj(req, res, next);
});

require('./static-routes')(app);

require('./routes')(app);

var restServerConfig = Object.assign({}, config.get('restServer'));
if (process.env.REST_SERVER_URLS ) {
  try {
    var restServerEnv = JSON.parse(process.env.REST_SERVER_URLS);
    if (Object.keys(restServerEnv).length === 0) {
      throw new Error();
    }
    var firstRestServer = restServerEnv[Object.keys(restServerEnv)[0]];
    restServerConfig = Object.assign(restServerConfig, firstRestServer); // allow for them to only specify some fields
  } catch (err) {
    console.error('Error getting rest config from env vars, using default');
  }
}

var tutorialParser = new TutorialParser(path.join(__dirname,'../tutorial.md'));
var tutorialMdAsObj = tutorialParser.parse(process.env.PLAYGROUND_URL, restServerConfig.httpURL.replace('/api', ''));
app.set('config', {
  restServer: restServerConfig,
  tutorial: tutorialMdAsObj
})

app.get('/assets/config.json', (req, res) => {
  res.json({
    restServer: restServerConfig,
    tutorial: tutorialMdAsObj
  })
})

var manufactureIndexHTML = fs.readFileSync(path.join(__dirname, '../node_modules/vehicle-manufacture-manufacturing/client/index.html')).toString().split('\n');
manufactureIndexHTML.some((line, index) => {
  if(line.indexOf('<link') > -1) {
    manufactureIndexHTML.splice(index, 0, '<link rel="stylesheet" href="/custom-application-styles/manufacturer.css">');
    return true;
  }
})
manufactureIndexHTML = manufactureIndexHTML.join('\n');

var regulatorIndexHTML = fs.readFileSync(path.join(__dirname, '../node_modules/vehicle-manufacture-vda/client/index.html')).toString().split('\n');
regulatorIndexHTML.some((line, index) => {
  if(line.indexOf('<link') > -1) {
    regulatorIndexHTML.splice(index, 0, '<link rel="stylesheet" href="/custom-application-styles/regulator.css">');
    return true;
  }
})
regulatorIndexHTML = regulatorIndexHTML.join('\n');

app.use('/tutorial', function (req, res) {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.use('/car-builder', function (req, res) {
  res.sendFile(path.join(__dirname, '../node_modules/vehicle-manufacture-car-builder/www', 'index.html'));
});

app.use('/manufacturer-dashboard', function (req, res) {
  res.send(manufactureIndexHTML);
});

app.use('/regulator-dashboard', function (req, res) {
  res.send(regulatorIndexHTML);
});

app.use('/*', function (req, res) {
  res.redirect('/tutorial');
})

var wss = new WebSocket.Server({ server: server });
wss.on('connection', function (ws) {
  var location = url.parse(ws.upgradeReq.url, true);
  console.log('client connected', location.pathname);
  var remoteURL = restServerConfig.webSocketURL + location.pathname;
  console.log('creating remote connection', remoteURL);
  var remote = new WebSocket(remoteURL);
  ws.on('close', function (code, reason) {
    console.log('client closed', location.pathname, code, reason);
    remote.close();
  });
  ws.on('message', function (data) {
    console.log('message from client', data);
    remote.send(data);
  });
  remote.on('open', function () {
    console.log('remote open', location.pathname);
  })
  remote.on('close', function (code, reason) {
    console.log('remote closed', location.pathname, code, reason);
    ws.close();
  });
  remote.on('message', function (data) {
    console.log('message from remote', data);
    ws.send(data);
  });

  remote.on('error', function (data) {
    console.log('AN ERROR OCCURED: ', data);
    ws.close();
  });
});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port
server.listen(appEnv.port, function () {
  'use strict';
  // print a message when the server starts listening
  console.log('server starting on ' + appEnv.url);
});
