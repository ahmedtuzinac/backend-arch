FROM node:22-alpine AS build

WORKDIR /app

COPY services/frontend/package*.json ./
RUN npm ci

COPY services/frontend/ .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY services/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
