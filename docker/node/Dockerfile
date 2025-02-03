FROM node:22-alpine3.20 AS base
LABEL maintainer="Thibaut BAYER<bt0r>"
WORKDIR /app
COPY . .
RUN apk add tzdata
RUN cp /usr/share/zoneinfo/Europe/Paris /etc/localtime
RUN npm install
RUN npm install -g typescript
RUN npm install -g webpack-cli
CMD ["node","dist/index.js"]

