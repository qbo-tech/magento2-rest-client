module.exports = function (restClient) {
    var module = {};

    module.subscribe = function (email) {
        if (email) {
            return restClient.post('/newsletter/subscribe', {
                "email": email
            });
        }
    }

    return module;
}
