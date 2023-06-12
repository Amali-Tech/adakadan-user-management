FROM node:alpine

WORKDIR /user-management

COPY package.json yarn.lock ./

COPY . .

RUN yarn install

# RUN npm run migrate
EXPOSE 3000

RUN yarn build

CMD ["yarn", "start"]