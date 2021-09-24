FROM node:16-alpine

LABEL MAINTAINER="Nino <cutie@floofy.dev>"
RUN apk update && apk add git ca-certificates

WORKDIR /app/Nino
COPY . .
RUN apk add --no-cache git
RUN npm i -g typescript eslint
RUN yarn
RUN yarn build:no-lint
RUN yarn cache clean
RUN rm -rf src .actions .github .idea .husky scripts

# Give it executable permissions
RUN chmod +x ./docker/docker-entrypoint.sh

ENTRYPOINT [ "sh", "./docker/docker-entrypoint.sh" ]
