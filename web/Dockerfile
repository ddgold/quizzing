FROM node:15.2.0 as builder
ARG server_url
ENV REACT_APP_SERVER_URL=${server_url}
WORKDIR /app
COPY ./ ./
RUN yarn install
RUN yarn build

FROM nginx:1.19.4-alpine
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /app/html
CMD ["nginx", "-g", "daemon off;"]