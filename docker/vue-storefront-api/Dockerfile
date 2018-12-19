FROM node:8-alpine

ENV VS_ENV prod

WORKDIR /var/www

RUN apk add --no-cache curl

COPY package.json ./

#RUN apk add --no-cache --virtual .build-deps ca-certificates wget git && \
#    apk add --update --repository http://dl-3.alpinelinux.org/alpine/edge/testing vips-tools && \
#    apk add vips-dev fftw-dev build-base --update-cache --repository https://dl-3.alpinelinux.org/alpine/edge/testing && \
#    apk add python nodejs g++ make && \
#    yarn install --no-cache && \
#    apk del .build-deps

RUN apk add --no-cache --virtual .build-deps ca-certificates wget git && \
    yarn install --no-cache && \
    apk del .build-deps

COPY docker/vue-storefront-api/vue-storefront-api.sh /usr/local/bin/

CMD ["vue-storefront-api.sh"]
