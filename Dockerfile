FROM node:16-alpine

# Set cache dir for nodejs
ENV CACHE_DIR="/cache"
VOLUME [ "/cache" ]

COPY package.json yarn.lock ./
COPY lib .

EXPOSE 3000 

RUN yarn install