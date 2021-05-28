FROM node:16-alpine

LABEL MAINTAINER="Nino <cutie@floofy.dev>"
RUN apk update && apk add git ca-certificates

WORKDIR /opt/Nino
COPY . .
RUN apk add --no-cache git
RUN npm i -g typescript eslint typeorm
RUN npm ci
RUN npm run build:no-lint
RUN npm cache clean --force

# Give it executable permissions
RUN chmod +x ./scripts/run-docker.sh

ENTRYPOINT [ "sh", "./scripts/run-docker.sh" ]
