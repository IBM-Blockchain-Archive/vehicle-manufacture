module.exports = function (app) {
  'use strict'

  app.use('/orders', require(__dirname+'/../node_modules/vehicle-manufacture-manufacturing/server/api/orders'))
  app.use('/updateOrderStatus', require(__dirname+'/../node_modules/vehicle-manufacture-manufacturing/server/api/updateOrderStatus'))
  app.use('/transactions', require(__dirname+'/../node_modules/vehicle-manufacture-vda/server/api/transactions'))
  app.use('/vehicles', require(__dirname+'/../node_modules/vehicle-manufacture-vda/server/api/vehicles'))
}
