module.exports = function (restClient) {
    var module = {};

    module.apply = function (cartId, giftCardCode) {

        if (cartId) {
            return restClient.post('/giftcard/apply', {
                "cart_id": cartId,
                "code": giftCardCode
            });
        }

    }

    module.remove = function (cartId, giftCardCode) {
        if (cartId) {
            return restClient.post('/giftcard/remove', {
                "cart_id": cartId,
                "code": giftCardCode
            });
        }
    }

    
    return module;
}