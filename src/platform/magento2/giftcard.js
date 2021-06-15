import AbstractGiftcardProxy from '../abstract/giftcard'
import { multiStoreConfig } from './util'

class GiftcardProxy extends AbstractGiftcardProxy {
  constructor (config, req) {
    const Magento2Client = require('magento2-rest-client').Magento2Client;
    super(config, req)
    this.api = Magento2Client(multiStoreConfig(config.magento2.api, req));
  }

  apply (cartId, giftcardCode, giftcardNip) {
    return this.api.giftcard.apply(cartId, giftcardCode, giftcardNip)
  }

  remove (cartId, giftcardCode) {
    return this.api.giftcard.remove(cartId, giftcardCode)
  }
}

module.exports = GiftcardProxy
