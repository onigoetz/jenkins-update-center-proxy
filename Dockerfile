FROM node:18-alpine

# Set cache dir for nodejs
ENV CACHE_DIR="/cache"
VOLUME [ "/cache" ]

WORKDIR /app

COPY package.json yarn.lock index.js ./
COPY lib ./lib

EXPOSE 3000 

RUN yarn install --production

CMD [ "index.js" ]
