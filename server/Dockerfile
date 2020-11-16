FROM node:15.2.0 as builder
WORKDIR /app
COPY ./ ./
RUN yarn install
RUN yarn global add typescript
RUN yarn build

FROM node:15.2.0-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY ./package.json ./tsconfig.json ./
RUN yarn install
COPY --from=builder /app/build ./src
EXPOSE 8000
CMD ["node", "./src/server.js"]
