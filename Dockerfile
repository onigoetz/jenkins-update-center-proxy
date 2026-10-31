FROM node:24.22.2-alpine

# Set cache dir for nodejs
ENV CACHE_DIR="/cache"
VOLUME [ "/cache" ]

WORKDIR /app

COPY package.json yarn.lock index.js ./
COPY .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases
COPY lib ./lib

EXPOSE 3000 

RUN corepack enable
RUN yarn workspaces focus --all --production

CMD [ "index.js" ]
