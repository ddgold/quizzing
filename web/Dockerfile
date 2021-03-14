FROM node:15.2.0 as builder
ARG REACT_APP_SERVER_URI
ENV REACT_APP_SERVER_URI=${REACT_APP_SERVER_URI}
WORKDIR /app
COPY ./web/package.json ./web/tsconfig.json yarn.lock ./
RUN yarn install --immutable
COPY ./web/public ./public
COPY ./web/src ./src
RUN yarn build

FROM nginx:1.19.4-alpine
COPY ./web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /app/html
CMD ["nginx", "-g", "daemon off;"]
