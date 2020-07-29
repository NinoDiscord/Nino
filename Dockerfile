FROM node:lts-alpine

RUN apk add yarn
RUN apk add git
COPY . /app
WORKDIR /app
RUN yarn && yarn run build

ENTRYPOINT ["yarn", "run", "main"]