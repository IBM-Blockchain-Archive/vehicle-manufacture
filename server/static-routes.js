module.exports = function (app) {
    require('./static-routes/vehicle-manufacture-car-builder')(app);
    require('./static-routes/vehicle-manufacture-manufacturing')(app);
    require('./static-routes/vehicle-manufacture-regulator')(app);
}