FROM node:15-alpine

LABEL MAINTAINER="Nino <cutie@floofy.dev>"
RUN apk update && apk add git ca-certificates

WORKDIR /opt/Nino
COPY . .
RUN apk add --no-cache git
RUN npm i -g typescript eslint typeorm
RUN npm ci && npm run build
RUN rm -rf src
RUN npm cache clean --force

ENTRYPOINT [ "npm", "run", "start" ]
