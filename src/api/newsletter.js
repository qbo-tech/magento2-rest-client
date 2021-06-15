import { apiStatus } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory';

export default ({ config, db }) => {

    let newsletterApi = Router();

    const _getProxy = (req) => {
        const platform = config.platform
        const factory = new PlatformFactory(config, req)
        return factory.getAdapter(platform, 'newsletter')
    };

    /** 
     * POST use a newsletter point
     * req.body.cartId - cart id
     */
    newsletterApi.post('/subscribe', (req, res) => {
        const newsletterProxy = _getProxy(req)

        console.log('newsletterProxy', newsletterProxy)

        if (!req.body.email) {
            return apiStatus(res, 'No email value provided within the request body', 500)
        }

        newsletterProxy.subscribe(req.body.email).then((result) => {
            apiStatus(res, result, 200);
        }).catch(err => {
            apiStatus(res, err, 500);
        })

    })

    return newsletterApi
}