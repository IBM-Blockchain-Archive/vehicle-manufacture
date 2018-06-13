var express = require('express');
var path = require('path');
var expressLess = require('express-less');

module.exports = function (app) {
    app.use('/regulator', express.static(path.join(__dirname, '../../node_modules/vehicle-manufacture-vda', 'client')));

    app.use('/regulator/less/stylesheets/*', function (req, res, next) {
        var url = req.originalUrl;
        var relativePath = url.replace('regulator/less/stylesheets/', '');
        var lessCSSFile = path.join('../../node_modules/vehicle-manufacture-vda/client', relativePath);
        req.url = lessCSSFile;
        var expressLessObj = expressLess(__dirname, {
            compress: true,
            debug: true
        });
        expressLessObj(req, res, next);
    });
}