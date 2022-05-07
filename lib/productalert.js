module.exports = function (restClient) {
    var module = {};

    module.subscribe = function (productId,customerId) {
        
        if (productId && customerId) {
            return restClient.post('/product-alert/subscribe', {
                "productId": productId,
                "customerId": customerId
            });
        }
        
    }

    module.unsubscribe = function (productId,customerId) {
        if (productId && customerId) {
            return restClient.post('/product-alert/unsubscribe', {
                "productId": productId,
                "customerId": customerId
            });
        }
    }

    return module;
}