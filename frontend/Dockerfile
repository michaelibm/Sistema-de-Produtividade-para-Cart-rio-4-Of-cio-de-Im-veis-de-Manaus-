# Dockerfile para Frontend React
FROM node:18-alpine as build

# Diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage 2: Serve com nginx
FROM nginx:alpine

# Copia build do React
COPY --from=build /app/build /usr/share/nginx/html

# Copia configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe porta 80
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
