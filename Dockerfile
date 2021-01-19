FROM node:alpine

WORKDIR /opt/Nino

COPY . .
RUN apk add --no-cache git
RUN npm ci
RUN npm test
RUN npm run build

ENTRYPOINT [ "npm", "run", "start" ]
