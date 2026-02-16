# 🚀 Guia de Início Rápido

## Setup em 5 minutos

### 1. Instalar PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS (com Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
- Baixe o instalador: https://www.postgresql.org/download/windows/

### 2. Criar Banco de Dados

```bash
# Acesse o PostgreSQL
sudo -u postgres psql

# No prompt do PostgreSQL:
CREATE DATABASE cartorio_db;
\q

# Execute o script de inicialização
cd cartorio-app/backend
psql -U postgres -d cartorio_db -f config/init.sql
```

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env se necessário
npm run dev
```

O backend estará rodando em `http://localhost:5000`

### 4. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm start
```

O frontend estará rodando em `http://localhost:3000`

### 5. Fazer Login

Acesse `http://localhost:3000` e faça login com:

- **Email:** admin@cartorio.com
- **Senha:** admin123

## ✅ Pronto!

Agora você pode:

1. **Criar tipos de serviço** (Menu: Tipos de Serviço)
2. **Cadastrar funcionários** (Menu: Funcionários)
3. **Adicionar protocolos** (Menu: Protocolos)
4. **Ver relatórios** (Menu: Relatórios)
5. **Configurar feriados** (Menu: Configurações)

## 🔧 Problemas Comuns

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Se não estiver, iniciar
sudo systemctl start postgresql
```

### Porta já em uso
Mude as portas nos arquivos `.env`:
- Backend: `PORT=5001`
- Frontend: `REACT_APP_API_URL=http://localhost:5001/api`

### Erro ao executar init.sql
```bash
# Garantir que você tem permissões
sudo -u postgres psql -d cartorio_db -f config/init.sql
```

## 📝 Estrutura de Permissões

### Supervisor
- Acesso total ao sistema
- Criar/editar tipos de serviço
- Gerenciar funcionários
- Cadastrar feriados
- Ver todos os relatórios

### Escrevente/Auxiliar
- Ver dashboard
- Gerenciar protocolos
- Ver relatórios básicos

## 🎯 Próximos Passos

1. Mude a senha do usuário admin
2. Cadastre seus funcionários
3. Configure os tipos de serviço do seu cartório
4. Adicione feriados locais
5. Comece a cadastrar protocolos!

## 💡 Dicas

- Use dias úteis para serviços com prazo legal
- Configure todos os feriados para cálculo correto
- Acompanhe o dashboard diariamente
- Gere relatórios semanalmente

## 📞 Suporte

Problemas? Abra uma issue no repositório!
