
module.exports = function (restClient) {
    var module = {};

    module.use = function (cartId) {
        if (cartId) {
            return restClient.post('/reward/mine/use', { cart_id: cartId });
        }
    }

    module.remove = function (cartId) {
        if (cartId) {
            return restClient.post('/reward/mine/remove', { cart_id: cartId });
        }
    }

    return module;
}
