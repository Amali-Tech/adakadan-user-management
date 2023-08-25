FROM node:alpine

WORKDIR /app

COPY package.json yarn.lock ./

COPY . .

RUN yarn install

ENV PORT=3000

RUN yarn build

CMD ["yarn", "start"]