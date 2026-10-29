# Garrison dashboard image. Build from the dashboard directory:
#   docker build -t jchristn77/garrison-dashboard:<tag> dashboard

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

FROM nginx:alpine
ARG GARRISON_VERSION=0.2.0
LABEL org.opencontainers.image.title="garrison-dashboard" \
      org.opencontainers.image.version="${GARRISON_VERSION}" \
      org.opencontainers.image.source="https://github.com/jchristn/Garrison" \
      org.opencontainers.image.licenses="MIT"
# Apply Alpine security updates published after the nginx base image was built.
RUN apk upgrade --no-cache
RUN apk add --no-cache curl
COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/garrison-security-headers.inc
COPY docker-entrypoint.sh /docker-entrypoint.d/40-garrison-config.sh
RUN chmod 755 /docker-entrypoint.d/40-garrison-config.sh
ENV GARRISON_API_URL="" \
    GARRISON_CSP_CONNECT_SRC="" \
    GARRISON_API_UPSTREAM="http://garrison-server:8700"
EXPOSE 80
