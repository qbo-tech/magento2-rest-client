'use strict';

var RestClient = require('./lib/rest_client').RestClient;
var categories = require('./lib/categories');
var attributes = require('./lib/attributes');
var products = require('./lib/products');
var productMedia = require('./lib/product_media');
var categoryProducts = require('./lib/category_products');
var configurableChildren = require('./lib/configurable_children');
var configurableOptions = require('./lib/configurable_options');
var taxRates = require('./lib/tax_rates');
var taxRules = require('./lib/tax_rules');
var stockItems = require('./lib/stock_items');
var customers = require('./lib/customers');
var directory = require('./lib/directory');
var cart = require('./lib/cart');
var orders = require('./lib/orders');
var reviews = require('./lib/reviews');
var reward = require('./lib/reward');
var giftcard = require('./lib/giftcard');
var newsletter = require('./lib/newsletter');

const MAGENTO_API_VERSION = 'V1';

module.exports.Magento2Client = function (options) {
    var instance = {
        addMethods (key, module) {
            var client = RestClient(options);
            if (module) {
                if (this[key])
                    this[key] = Object.assign(this[key], module(client))
                else 
                    this[key] = module(client)
            }
        }
    };

    options.version = MAGENTO_API_VERSION;
    
    var client = RestClient(options);

    instance.attributes = attributes(client);
    instance.categories = categories(client);
    instance.products = products(client);
    instance.productMedia = productMedia(client);
    instance.categoryProducts = categoryProducts(client);
    instance.configurableChildren = configurableChildren(client);
    instance.configurableOptions = configurableOptions(client);
    instance.stockItems = stockItems(client);
    instance.taxRates = taxRates(client);
    instance.taxRules = taxRules(client);
    instance.customers = customers(client);
    instance.cart = cart(client);
    instance.orders = orders(client);
    instance.directory = directory(client);
    instance.reviews = reviews(client);
    instance.reward = reward(client);
    instance.giftcard = giftcard(client);
    instance.newsletter = newsletter(client);

    return instance;
}
