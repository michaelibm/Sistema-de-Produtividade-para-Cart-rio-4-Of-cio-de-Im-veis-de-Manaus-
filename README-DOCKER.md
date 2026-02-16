# 🐳 Sistema de Cartório - Docker

Sistema de Produtividade para Cartório 1º Ofício de Imóveis de Manaus.

## 📋 Pré-requisitos

- Docker (versão 20.10 ou superior)
- Docker Compose (versão 2.0 ou superior)

## 🚀 Instalação e Execução

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd cartorio-sistema
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- Altere `JWT_SECRET` para um valor seguro
- Altere `POSTGRES_PASSWORD` para uma senha forte
- Ajuste as portas se necessário

### 3. Inicie os containers

```bash
docker-compose up -d
```

Este comando irá:
- ✅ Baixar e configurar o PostgreSQL
- ✅ Construir e iniciar o backend (Node.js)
- ✅ Construir e iniciar o frontend (React + Nginx)

### 4. Acesse o sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Banco de Dados**: localhost:5432

### 5. Credenciais padrão (usuário demo)

```
Email: admin@cartorio.com
Senha: admin123
```

## 📦 Comandos Úteis

### Ver logs dos containers

```bash
# Todos os containers
docker-compose logs -f

# Apenas frontend
docker-compose logs -f frontend

# Apenas backend
docker-compose logs -f backend

# Apenas banco de dados
docker-compose logs -f postgres
```

### Parar os containers

```bash
docker-compose down
```

### Parar e remover volumes (⚠️ apaga dados do banco)

```bash
docker-compose down -v
```

### Reiniciar um serviço específico

```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

### Reconstruir os containers

```bash
docker-compose up -d --build
```

### Acessar o shell de um container

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# Banco de dados
docker-compose exec postgres psql -U cartorio_user -d cartorio_db
```

## 🗄️ Backup do Banco de Dados

### Criar backup

```bash
docker-compose exec postgres pg_dump -U cartorio_user cartorio_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
cat backup_20240101_120000.sql | docker-compose exec -T postgres psql -U cartorio_user -d cartorio_db
```

## 🔧 Estrutura dos Diretórios

```
.
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🌐 Variáveis de Ambiente

### Backend
- `NODE_ENV`: Ambiente (production/development)
- `PORT`: Porta do backend (padrão: 5000)
- `DATABASE_URL`: URL de conexão com PostgreSQL
- `JWT_SECRET`: Chave secreta para tokens JWT
- `CORS_ORIGIN`: Origem permitida para CORS

### Frontend
- `REACT_APP_API_URL`: URL da API backend

### Banco de Dados
- `POSTGRES_USER`: Usuário do PostgreSQL
- `POSTGRES_PASSWORD`: Senha do PostgreSQL
- `POSTGRES_DB`: Nome do banco de dados

## 🔒 Segurança

### Recomendações para Produção:

1. **Altere todas as senhas padrão**
   ```bash
   # Gere senhas fortes
   openssl rand -base64 32
   ```

2. **Use HTTPS**
   - Configure um reverse proxy (Nginx/Traefik)
   - Adicione certificados SSL (Let's Encrypt)

3. **Firewall**
   - Bloqueie acesso direto às portas 5000 e 5432
   - Exponha apenas a porta 80/443

4. **Atualizações**
   ```bash
   # Atualize as imagens regularmente
   docker-compose pull
   docker-compose up -d
   ```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Verifique os logs
docker-compose logs backend

# Verifique se as portas estão em uso
netstat -tuln | grep -E '3000|5000|5432'
```

### Erro de conexão com banco de dados

```bash
# Verifique se o PostgreSQL está rodando
docker-compose ps postgres

# Teste a conexão
docker-compose exec postgres pg_isready -U cartorio_user
```

### Frontend não carrega

```bash
# Reconstrua o frontend
docker-compose up -d --build frontend

# Limpe o cache do navegador
# Ctrl + Shift + R (Chrome/Firefox)
```

### Permissões de arquivo

```bash
# No Linux, se houver problemas de permissão
sudo chown -R $USER:$USER .
```

## 📊 Monitoramento

### Verificar status dos containers

```bash
docker-compose ps
```

### Verificar uso de recursos

```bash
docker stats
```

### Healthcheck

```bash
# Backend
curl http://localhost:5000/api/health

# Frontend
curl http://localhost:3000
```

## 🚀 Deploy em Produção

### Usando Docker Swarm

```bash
docker swarm init
docker stack deploy -c docker-compose.yml cartorio
```

### Usando Kubernetes

Converta o docker-compose para Kubernetes:

```bash
kompose convert -f docker-compose.yml
kubectl apply -f .
```

## 📝 Notas

- O volume `postgres_data` persiste os dados do banco mesmo após parar os containers
- Logs são exibidos em tempo real com `docker-compose logs -f`
- Para desenvolvimento, use `docker-compose -f docker-compose.dev.yml up`

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker-compose logs -f`
2. Consulte a documentação do Docker
3. Abra uma issue no repositório

---

**Sistema desenvolvido para o Cartório 1º Ofício de Imóveis de Manaus** 🏛️
