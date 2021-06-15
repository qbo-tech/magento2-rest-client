import { apiStatus } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory';

export default ({ config, db }) => {

    let giftcardApi = Router();

    const _getProxy = (req) => {
        const platform = config.platform
        const factory = new PlatformFactory(config, req)
        return factory.getAdapter(platform, 'giftcard')
    };

    /** 
     * POST use a giftcard point
     * req.body.cartId - cart id
     */
    giftcardApi.post('/apply', (req, res) => {
        const giftcardProxy = _getProxy(req)
        if (!req.body.cartId) {
            return apiStatus(res, 'No cartId value provided within the request body', 500)
        }

        giftcardProxy.apply(req.body.cartId, req.body.giftCardCode, req.body.giftCardNip).then((result) => {
            apiStatus(res, result, 200);
        }).catch(err => {
            apiStatus(res, err, 500);
        })

    })

    /** 
     * POST remove a giftcard point
     * req.body.cartId - cart id
     */
    giftcardApi.post('/remove', (req, res) => {
        const giftcardProxy = _getProxy(req)

        if (!req.body.cartId) {
            return apiStatus(res, 'No cartId value provided within the request body', 500)
        }

        giftcardProxy.remove(req.body.cartId, req.body.giftCardCode).then((result) => {
            apiStatus(res, result, 200);
        }).catch(err => {
            apiStatus(res, err, 500);
        })

    })

    return giftcardApi
}