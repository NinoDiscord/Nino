FROM node:alpine

WORKDIR /opt/Nino
COPY package*.json ./
RUN apk add git
RUN yarn
RUN npm install -g eslint
COPY . .
RUN yarn build

CMD [ "yarn", "run", "main" ]
