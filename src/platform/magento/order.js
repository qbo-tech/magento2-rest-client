import AbstractOrderProxy from '../abstract/order'
import { processSingleOrder } from './o2m1'

class OrderProxy extends AbstractOrderProxy {
  constructor (config, req) {
    const MagentoClient = require('magento1-vsbridge-client').MagentoClient;
    super(config, req)
    this.config = config
    this.api = MagentoClient(config.magento.vsbridge.url, req);
  }

  create (orderData) {
      const inst = this
      return new Promise ((resolve, reject) => {
        try {
            processSingleOrder(orderData, inst.config, null, (error, result) => {
                console.log(error)
                if (error) reject (error)
                resolve (result)
            })
        } catch (e) {
            reject(e)
        }
    })
  }
}

module.exports = OrderProxy
