module.exports = function (restClient) {
    var module = {};

    module.apply = function (cartId, giftCardCode, giftCardNip) {
        if (cartId) {
            return restClient.post('/checkoutgiftcard/applyGiftcard', {
                "cart_id": cartId,
                "gift_card_code": giftCardCode,
                "gift_card_nip": giftCardNip
            });
        }
    }

    module.remove = function (cartId, giftCardCode) {
        if (cartId) {
            return restClient.post('/checkoutgiftcard/remove' + cartId, {
                "cart_id": cartId,
                "gift_card_code": giftCardCode
            });
        }
    }

    return module;
}
