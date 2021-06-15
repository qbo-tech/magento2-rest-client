import AbstractRewardProxy from '../abstract/reward'
import { multiStoreConfig } from './util'

class RewardProxy extends AbstractRewardProxy {
  constructor (config, req) {
    const Magento2Client = require('magento2-rest-client').Magento2Client;
    super(config, req)
    this.api = Magento2Client(multiStoreConfig(config.magento2.api, req));
  }

  use (cartId) {
    return this.api.reward.use(cartId)
  }

  remove (cartId) {
    return this.api.reward.remove(cartId)
  }
}

module.exports = RewardProxy
