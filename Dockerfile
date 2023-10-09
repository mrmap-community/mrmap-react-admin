################################
# Base build Image
################################  
FROM node:20-alpine3.17 AS BUILD
WORKDIR /opt/mrmap-react-admin
COPY ./ ./
RUN npm install && \
    npm run build

FROM nginx:1.25.2-alpine-slim
COPY --from=BUILD /opt/mrmap-react-admin/dist /var/www/mrmap-react-admin
COPY nginx/mrmap-react-admin.conf /etc/nginx/conf.d/default.conf
