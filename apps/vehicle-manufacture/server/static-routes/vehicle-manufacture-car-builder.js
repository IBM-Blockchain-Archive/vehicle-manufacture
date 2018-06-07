var express = require('express');
var path = require('path');
var fs = require('fs');

module.exports = function (app) {
    app.use('/car-builder', express.static(path.join(__dirname, '../../node_modules/vehicle-manufacture-car-builder', 'www')));
}