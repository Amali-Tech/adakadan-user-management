FROM node:alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

COPY . .

RUN yarn install

EXPOSE 3000

RUN yarn build

CMD ["yarn", "start"]