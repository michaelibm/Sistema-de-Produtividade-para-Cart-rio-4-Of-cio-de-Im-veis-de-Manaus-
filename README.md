# 🏛️ Sistema de Produtividade para Cartório de Imóveis

Sistema completo para gerenciamento de protocolos e monitoramento de produtividade em cartórios de imóveis.

## 🚀 Tecnologias

### Backend
- Node.js + Express
- PostgreSQL
- JWT para autenticação
- Bcrypt para senhas

### Frontend
- React
- React Router
- CSS moderno
- Fetch API

## 📋 Pré-requisitos

- Node.js (v16 ou superior)
- PostgreSQL (v12 ou superior)
- npm ou yarn

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd cartorio-app
```

### 2. Configure o Banco de Dados

Instale e inicie o PostgreSQL, depois crie o banco:

```bash
# Entrar no PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE cartorio_db;

# Sair
\q

# Executar script de inicialização
psql -U postgres -d cartorio_db -f backend/config/init.sql
```

### 3. Configure o Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env

# Edite o .env com suas configurações
nano .env
```

**Configuração do .env:**
```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=cartorio_db
DB_PASSWORD=sua_senha_aqui
DB_PORT=5432
JWT_SECRET=seu_secret_super_seguro_mude_em_producao
CORS_ORIGIN=http://localhost:3000
```

### 4. Configure o Frontend

```bash
cd ../frontend

# Instalar dependências
npm install

# Criar arquivo .env
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

## ▶️ Executando o Projeto

### Iniciar Backend

```bash
cd backend
npm run dev
# Servidor rodando em http://localhost:5000
```

### Iniciar Frontend

Em outro terminal:

```bash
cd frontend
npm start
# Aplicação rodando em http://localhost:3000
```

## 🔑 Acesso Inicial

**Usuário padrão (Supervisor):**
- Email: `admin@cartorio.com`
- Senha: `admin123`

⚠️ **IMPORTANTE:** Mude a senha padrão em produção!

## 📚 Funcionalidades

### ✅ Gerais
- ✨ Login com autenticação JWT
- 🔐 Controle de permissões por cargo
- 📊 Dashboard com métricas em tempo real
- 🔔 Alertas de prazos vencendo

### 📋 Protocolos
- Cadastro de novos protocolos
- Cálculo automático de prazos (dias úteis/corridos)
- Exclusão de finais de semana e feriados
- Atribuição a funcionários
- Conclusão e histórico

### ⚙️ Tipos de Serviço
- Cadastro configurável de serviços
- Definição de prazos personalizados
- Escolha entre dias úteis ou corridos

### 👥 Gestão de Funcionários
- Cadastro de usuários
- Diferentes níveis de permissão
- Acompanhamento de desempenho

### 📈 Relatórios
- Produtividade por funcionário
- Estatísticas por tipo de serviço
- Protocolos atrasados
- Protocolos vencendo
- Taxa de sucesso

### 🔧 Configurações
- Cadastro de feriados
- Gerenciamento de datas não úteis

## 🏗️ Estrutura do Projeto

```
cartorio-app/
├── backend/
│   ├── config/
│   │   ├── database.js       # Configuração PostgreSQL
│   │   └── init.sql          # Script de inicialização do DB
│   ├── middleware/
│   │   └── auth.js           # Middleware de autenticação
│   ├── routes/
│   │   ├── auth.js           # Rotas de login/registro
│   │   ├── protocolos.js     # Rotas de protocolos
│   │   ├── servicos.js       # Rotas de serviços
│   │   ├── funcionarios.js   # Rotas de funcionários
│   │   ├── feriados.js       # Rotas de feriados
│   │   └── relatorios.js     # Rotas de relatórios
│   ├── server.js             # Servidor Express
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Sidebar.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Protocolos.jsx
    │   │   ├── Servicos.jsx
    │   │   ├── Funcionarios.jsx
    │   │   ├── Relatorios.jsx
    │   │   └── Configuracoes.jsx
    │   ├── services/
    │   │   └── api.js          # Serviço de API
    │   ├── styles/
    │   │   └── *.css
    │   └── App.jsx
    └── package.json
```

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Autenticação JWT
- Proteção de rotas no backend
- Validação de permissões por cargo
- Headers CORS configurados

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro

### Protocolos
- `GET /api/protocolos` - Listar protocolos
- `GET /api/protocolos/:id` - Buscar protocolo
- `POST /api/protocolos` - Criar protocolo
- `PUT /api/protocolos/:id` - Atualizar protocolo
- `PATCH /api/protocolos/:id/concluir` - Concluir protocolo
- `GET /api/protocolos/dashboard/stats` - Estatísticas

### Serviços
- `GET /api/servicos` - Listar serviços
- `POST /api/servicos` - Criar serviço (supervisor)
- `PUT /api/servicos/:id` - Atualizar serviço (supervisor)
- `DELETE /api/servicos/:id` - Excluir serviço (supervisor)

### Funcionários
- `GET /api/funcionarios` - Listar funcionários
- `POST /api/funcionarios` - Criar funcionário (supervisor)
- `PUT /api/funcionarios/:id` - Atualizar funcionário (supervisor)
- `DELETE /api/funcionarios/:id` - Excluir funcionário (supervisor)

### Feriados
- `GET /api/feriados` - Listar feriados
- `POST /api/feriados` - Criar feriado (supervisor)
- `DELETE /api/feriados/:id` - Excluir feriado (supervisor)

### Relatórios
- `GET /api/relatorios/geral` - Relatório geral
- `GET /api/relatorios/por-funcionario` - Por funcionário
- `GET /api/relatorios/por-servico` - Por serviço
- `GET /api/relatorios/vencendo` - Protocolos vencendo
- `GET /api/relatorios/atrasados` - Protocolos atrasados
- `GET /api/relatorios/historico/:id` - Histórico do protocolo

## 🐛 Troubleshooting

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
sudo service postgresql status

# Iniciar PostgreSQL
sudo service postgresql start
```

### Porta já em uso
```bash
# Mudar porta no backend/.env
PORT=5001

# Mudar porta no frontend/.env
REACT_APP_API_URL=http://localhost:5001/api
```

## 📦 Build para Produção

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Arquivos gerados em build/
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

MIT

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

Desenvolvido com ❤️ para otimizar a gestão de cartórios
