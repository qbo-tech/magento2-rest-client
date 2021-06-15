import AbstractNewsletterProxy from '../abstract/newsletter'
import { multiStoreConfig } from './util'

class NewsletterProxy extends AbstractNewsletterProxy {
  constructor (config, req) {
    const Magento2Client = require('magento2-rest-client').Magento2Client;
    super(config, req)
    this.api = Magento2Client(multiStoreConfig(config.magento2.api, req));
  }

  subscribe(email) {
    return this.api.newsletter.subscribe(email)
  }
}

module.exports = NewsletterProxy
