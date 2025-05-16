# Étape 1 : Build React
FROM node:18-alpine as build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Étape 2 : Serveur NGINX avec fallback React Router
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
