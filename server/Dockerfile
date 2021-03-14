FROM node:15.2.0 as builder
WORKDIR /app
COPY ./server/package.json ./server/tsconfig.json yarn.lock ./
RUN yarn install --immutable
COPY ./server/src ./src
RUN yarn build

FROM node:15.2.0-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY ./server/package.json yarn.lock ./
RUN yarn install --immutable
COPY --from=builder /app/build ./src
EXPOSE 8000
CMD ["node", "./src/server.js"]
