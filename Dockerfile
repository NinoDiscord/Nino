FROM node:alpine

ARG branch
WORKDIR /opt/nino-${branch}

COPY . .
RUN apk add --no-cache git
RUN npm ci
RUN npm test
RUN npm run build

ENTRYPOINT [ "npm", "run", "start" ]
