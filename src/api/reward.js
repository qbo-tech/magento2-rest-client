import { apiStatus } from '../lib/util';
import { Router } from 'express';
import PlatformFactory from '../platform/factory';

export default ({ config, db }) => {

    let rewardApi = Router();

    const _getProxy = (req) => {
        const platform = config.platform
        const factory = new PlatformFactory(config, req)
        return factory.getAdapter(platform, 'reward')
    };

    /** 
     * POST use a reward point
     * req.body.cartId - cart id
     */
    rewardApi.post('/use', (req, res) => {
        const rewardProxy = _getProxy(req)
        if (!req.body.cartId) {
            return apiStatus(res, 'No cartId value provided within the request body', 500)
        }

        rewardProxy.use(req.body.cartId).then((result) => {
            apiStatus(res, result, 200);
        }).catch(err => {
            apiStatus(res, err, 500);
        })

    })

    /** 
     * POST remove a reward point
     * req.body.cartId - cart id
     */
    rewardApi.post('/remove', (req, res) => {
        const rewardProxy = _getProxy(req)

        if (!req.body.cartId) {
            return apiStatus(res, 'No cartId value provided within the request body', 500)
        }

        rewardProxy.remove(req.body.cartId).then((result) => {
            apiStatus(res, result, 200);
        }).catch(err => {
            apiStatus(res, err, 500);
        })

    })

    return rewardApi
}