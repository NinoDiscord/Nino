FROM node:latest

WORKDIR /opt/Nino
COPY package*.json ./
RUN yarn
RUN npm install -g eslint
COPY . .
RUN yarn build

CMD [ "yarn", "run", "main" ]