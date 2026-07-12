FROM node:20-alpine AS builder
WORKDIR /builder
COPY . .
RUN npm config set registry https://registry.npmmirror.com
RUN yarn install --slient
RUN yarn build

FROM nginx:alpine
WORKDIR /app
COPY --from=builder /builder/dist .
COPY --from=builder /builder/default.conf /etc/nginx/conf.d/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]