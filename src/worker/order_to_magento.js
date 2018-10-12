/**
 * CLI tool
 * Queue worker in charge of syncing the Sales order to Magento 1 via VSBridge Controller *
 */

const kue = require('kue');
const logger = require('./log');
const countryMapper = require('../lib/countrymapper')
const Ajv = require('ajv'); // json validator
const ajv = new Ajv(); // validator
const validate = ajv.compile(require('../models/order.schema.json'));

const config = require('config')
let queue = kue.createQueue(Object.assign(config.kue, { redis: config.redis }));
logger.info('> QUEUE CREATED')
let numCPUs = require('os').cpus().length;

const MagentoClient = require('magento1-vsbridge-client').MagentoClient;

const Redis = require('redis');
let redisClient = Redis.createClient(config.redis); // redis client
redisClient.on('error', function (err) { // workaround for https://github.com/NodeRedis/node_redis/issues/713
    redisClient = Redis.createClient(config.redis); // redis client
});

const CommandRouter = require('command-router');
const cli = CommandRouter();

cli.option({
  name: 'partitions',
  default: numCPUs,
  type: Number
});

function isNumeric(val) {
  return Number(parseFloat(val)).toString() === val;
}

/**
 * Send single order to Magento Instance (VSBridge Controllers)
 *
 * @param {json} orderData order data in format as described in '../models/order.md'
 * @param {Object} config global CLI configuration
 * @param {Function} done callback - @example done(new Error()) - to acknowledge problems
 */
function processSingleOrder(orderData, config, job, done) {

  logger.info('> PROCESSING SINGLE ORDER')
  const TOTAL_STEPS = 4;
  const THREAD_ID = 'ORD:' + (job ? job.id : 1) + ' - '; // job id
  let currentStep = 1;

  if (!validate(orderData)) { // schema validation of upcoming order
    logger.error(THREAD_ID + " Order validation error!", validate.errors);
    done(new Error('Error while validating order object',  validate.errors));

    if(job) job.progress(currentStep++, TOTAL_STEPS);
    return;
  }

  let isThisAuthOrder = parseInt(orderData.user_id) > 0
  const userId = orderData.user_id ? orderData.user_id : null;

  let apiConfig = config.magento.api
  if (orderData.store_code) {
    if (config.availableStores.indexOf(orderData.store_code) >= 0) {
      console.log(":: STORE CODE: " + orderData.store_code);
      apiConfig = Object.assign({}, apiConfig, { url: apiConfig.url + '/' + orderData.store_code })
      console.log('> Store code', orderData.store_code)
    } else {
      logger.error('Invalid store code', orderData.store_code)
    }
  }
  const api = MagentoClient(apiConfig);

  logger.info('> Order Id', orderData.order_id)
  logger.info('> Is order authorized?', isThisAuthOrder)
  logger.info('> User Id', userId)

  let cartId = orderData.cart_id
  // const cartIdPrepare = isThisAuthOrder ? api.cart.create(null, userId): ( cartId ? new Promise((resolve, reject) => {
  //   resolve (cartId)
  // }): api.cart.create(null))

  logger.info(THREAD_ID + '> Cart Id', cartId)

    api.cart.pull(userId, cartId).then((serverItems) => {
      
      const clientItems = orderData.products
      const syncPromises = []
      logger.info(THREAD_ID + '> Sync between clientItems', clientItems.map((item) => { return { sku: item.sku, qty: item.qty, server_item_id: item.item_id, product_options: item.product_options }}))
      logger.info(THREAD_ID + '> ... and serverItems', serverItems.result)

      for (const clientItem of clientItems) {
        const serverItem = serverItems.result.find((itm) => {
          return itm.sku === clientItem.sku // || itm.sku.indexOf(clientItem.sku + '-') >= 0 /* bundle products */
        })
        logger.info("SERVER ITEM: ", serverItem)
        if (!serverItem) {
          logger.info(THREAD_ID + '< No server item for ' + clientItem.sku)
          syncPromises.push(api.cart.update(userId, cartId, { // use magento API
            sku: clientItem.parentSku && config.cart.setConfigurableProductOptions ? clientItem.parentSku : clientItem.sku,
            qty: clientItem.qty,
            product_option: clientItem.product_option,
            quote_id: cartId
          }, isThisAuthOrder))
        } else if (serverItem.qty !== clientItem.qty) {
          logger.info(THREAD_ID + '< Wrong qty for ' + clientItem.sku, clientItem.qty, serverItem.qty)
          syncPromises.push(api.cart.update(userId, cartId, { // use magento API
            sku: clientItem.parentSku && config.cart.setConfigurableProductOptions ? clientItem.parentSku : clientItem.sku,
            qty: clientItem.qty,
            product_option: clientItem.product_option,
            cartItem: serverItem,
            quote_id: cartId
          }, isThisAuthOrder))
        } else {
          logger.info(THREAD_ID + '< Server and client items synced for ' + clientItem.sku) // here we need just update local item_id
        }
      }

      for (const serverItem of serverItems.result) {
        if (serverItem) {
          const clientItem = clientItems.find((itm) => {
            return itm.sku === serverItem.sku //|| serverItem.sku.indexOf(itm.sku + '-') >= 0 /* bundle products */
          })
          if (!clientItem) {
            logger.info(THREAD_ID + '< No client item for ' + serverItem.sku + ', removing from server cart') // use magento API
            syncPromises.push(api.cart.delete(userId, cartId, { // delete server side item if not present if client's cart
              cartItem: serverItem
            }, isThisAuthOrder))
          }
        }
      }

      Promise.all(syncPromises).then((results) => {
        if(job) job.progress(currentStep++, TOTAL_STEPS);
        logger.info(THREAD_ID + '< Server cart in sync')
        logger.debug(THREAD_ID + results)

        const billingAddr = orderData.addressInformation.billingAddress;
        const shippingAddr = orderData.addressInformation.shippingAddress;
        let mappedShippingRegion = 10
        let mappedBillingRegion = 10

        // api.directory.countries().then((countryList) => {
          if (shippingAddr.region_id > 0) {
            //mappedShippingRegion = { regionId: shippingAddr.region_id, regionCode: shippingAddr.region_code }
          } else {
            //mappedShippingRegion = countryMapper.mapCountryRegion(countryList, shippingAddr.country_id, shippingAddr.region_code ? shippingAddr.region_code : shippingAddr.region)
          }

          if (billingAddr.region_id > 0) {
            //mappedBillingRegion = { regionId: billingAddr.region_id, regionCode: billingAddr.region_code }
          } else {
            //mappedBillingRegion = countryMapper.mapCountryRegion(countryList, billingAddr.country_id, billingAddr.region_code ? billingAddr.region_code : billingAddr.region)
          }

          const billingAddressInfo = { // sum up totals
            "address": {
              "countryId": billingAddr.country_id,
              "street": billingAddr.street,
              "telephone": billingAddr.telephone,
              "postcode": billingAddr.postcode,
              "city": billingAddr.city,
              "firstname": billingAddr.firstname,
              "lastname": billingAddr.lastname,
              "email": billingAddr.email,
              "regionCode": mappedBillingRegion.regionCode,
              "regionId": mappedBillingRegion.regionId,
              "company": billingAddr.company,
              "vatId": billingAddr.vat_id
            }
          }

          const shippingAddressInfo = { // sum up totals
            "addressInformation": {
              "shippingAddress": {
                "countryId": shippingAddr.country_id,
                "street": shippingAddr.street,
                "telephone": shippingAddr.telephone,
                "postcode": shippingAddr.postcode,
                "city": shippingAddr.city,
                "firstname": shippingAddr.firstname,
                "lastname": shippingAddr.lastname,
                "email": shippingAddr.email,
                "regionId": mappedShippingRegion.regionId,
                "regionCode": mappedShippingRegion.regionCode,
                "company": shippingAddr.company
              },

              "billingAddress": {
                "countryId": billingAddr.country_id,
                "street": billingAddr.street,
                "telephone": billingAddr.telephone,
                "postcode": billingAddr.postcode,
                "city": billingAddr.city,
                "firstname": billingAddr.firstname,
                "lastname": billingAddr.lastname,
                "email": billingAddr.email,
                "regionId":  mappedBillingRegion.regionId,
                "regionCode": mappedBillingRegion.regionCode,
                "company": billingAddr.company,
                "vatId": billingAddr.vat_id
              },
              "shippingMethodCode": orderData.addressInformation.shipping_method_code,
              "shippingCarrierCode": orderData.addressInformation.shipping_carrier_code,
              "extensionAttributes": orderData.addressInformation.shippingExtraFields
            }
          }

            logger.info(THREAD_ID + '< Billing info', billingAddressInfo)
            api.cart.billingAddress(userId, cartId, billingAddressInfo, isThisAuthOrder).then((result) => {
            logger.info(THREAD_ID + '< Billing address assigned', result)
            logger.info(THREAD_ID + '< Shipping info', shippingAddressInfo)
            api.cart.shippingInformation(userId, cartId,  shippingAddressInfo, isThisAuthOrder).then((result) => {
              logger.info(THREAD_ID + '< Shipping address assigned', result)

              if(job) job.progress(currentStep++, TOTAL_STEPS);

              api.order.create(userId, cartId, {
                "paymentMethod": {
                  "method": orderData.addressInformation.payment_method_code,
                  "additional_data": orderData.addressInformation.payment_method_additional
                }
              }, isThisAuthOrder).then(result => {
                logger.info(THREAD_ID, result)
                if(job) job.progress(currentStep++, TOTAL_STEPS);

                logger.info(THREAD_ID + '[OK] Order placed with ORDER ID', result.result.orderId);
                logger.debug(THREAD_ID + result)
                redisClient.set("order$$id$$" + result.result.orderId, JSON.stringify({
                  platform_order_id: result.result.orderId,
                  transmited: true,
                  transmited_at: new Date(),
                  platform: 'magento',
                  order: orderData
                }));
                redisClient.set("order$$totals$$" + result.result.orderId, JSON.stringify(result.result.totals));

                if(job) job.progress(currentStep++, TOTAL_STEPS);
                return done(null, { magentoOrderId: result.result.orderId, transferedAt: new Date() });
              }).catch(err => {
                logger.error('Error placing an order: ', err, typeof err)
                if (job) job.attempts(6).backoff({ delay: 30*1000, type:'fixed' }).save()
                return done(new Error('Error placing an order: ' + err, err));
              })
            }).catch((errors) => {
              logger.error('Error while adding shipping address', errors)
              if (job) job.attempts(3).backoff({ delay: 60*1000, type:'fixed' }).save()
              return done(new Error('Error while adding shipping address', errors));
            })
          }).catch((errors) => {
            logger.error('Error while adding billing address', errors)
            if (job) job.attempts(3).backoff({ delay: 60*1000, type:'fixed' }).save()
            return done(new Error('Error while adding billing address', errors));
          })
        // }).catch((errors) => {
        //   logger.error('Error while synchronizing country list', errors)
        //   if (job) job.attempts(3).backoff({ delay: 30*1000, type:'fixed' }).save()
        //   return done(new Error('Error while syncing country list', errors));
        // })

      }).catch((errors) => {
        logger.error('Error while adding products', errors)
        if (job) job.attempts(3).backoff({ delay: 30*1000, type:'fixed' }).save()
        return done(new Error('Error while adding products', errors));
      })
    })
  

  // cartIdPrepare.then(processCart).catch((error) => { // cannot create a quote for specific user, so bypass by placing anonymous order
  //   logger.error(THREAD_ID, error)
  //   logger.info('< Bypassing to anonymous order')
  //   isThisAuthOrder = false

  //   if (isNumeric(cartId)) { // we have numeric id - assigned to the user provided
  //     api.cart.create(null, null).then((result) => {
  //       processCart(result)
  //     }).catch(error => {
  //       logger.info(error)
  //       return done(new Error('Error while adding products', error));
  //     }) // TODO: assign the guest cart with user at last?
  //   } else {
  //     logger.info(THREAD_ID + '< Using cartId provided with the order', cartId)
  //     processCart(cartId)
  //   }
  // })
}

// RUN
cli.command('start', () => { // default command is to run the service worker
  let partition_count = cli.options.partitions;

  logger.info('Starting KUE worker for "order" message ...');
  queue.process('order', partition_count, (job,done) => {
    logger.info('Processing order: ' + job.data.title);
    //logger.info(job.data.order);
    return processSingleOrder(job.data.order, config, job, done);
  });
}); 

cli.command('testAuth', () => {
  processSingleOrder(require('../../var/testOrderAuth.json'), config, null, (err, result) => {});
});

cli.command('testAnon', () => {
  processSingleOrder(require('../../var/testOrderAnon.json'), config, null, (err, result) => {});
});

cli.parse(process.argv);
