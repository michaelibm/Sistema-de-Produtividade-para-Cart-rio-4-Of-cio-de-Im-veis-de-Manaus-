# Dockerfile para Backend Node.js
FROM node:18-alpine

# Diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production



# Copia código fonte
COPY . .

# Expõe porta 5000
EXPOSE 5000

# Variáveis de ambiente (podem ser sobrescritas no docker-compose)
ENV NODE_ENV=production
ENV PORT=5000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
