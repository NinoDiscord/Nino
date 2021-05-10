FROM node:16-alpine

LABEL MAINTAINER="Nino <cutie@floofy.dev>"
RUN apk update && apk add git ca-certificates

WORKDIR /opt/Nino
COPY . .
RUN apk add --no-cache git
RUN npm i -g typescript eslint typeorm
RUN npm ci
RUN eslint src --ext .ts
RUN rm -rf build

# TODO: Fix this
# Override --sourceMap in the container
# so this doesn't happen: SyntaxError: Unexpected token ':'
RUN tsc --sourceMap false

RUN rm -rf src
RUN npm cache clean --force

ENTRYPOINT [ "npm", "run", "start" ]
