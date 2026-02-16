# 💻 Guia para VS Code

## 📥 Como Abrir no VS Code

### 1. Baixar e Extrair
1. Baixe o arquivo `cartorio-app.zip`
2. Extraia em uma pasta de sua preferência
3. Você terá uma pasta `cartorio-app/`

### 2. Abrir no VS Code
```bash
# Opção 1: Via terminal
cd caminho/para/cartorio-app
code .

# Opção 2: No VS Code
File > Open Folder > Selecione a pasta cartorio-app
```

## 🔧 Configuração Inicial

### 3. Instalar Extensões Recomendadas (VS Code)
- **ESLint** - Linting JavaScript
- **Prettier** - Formatação de código
- **PostgreSQL** - Gerenciar banco (opcional)
- **REST Client** - Testar API (opcional)

### 4. Abrir Terminal Integrado
No VS Code: `` Ctrl + ` `` (ou View > Terminal)

### 5. Setup Backend

**Terminal 1 - Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edite o .env se necessário
npm run dev
```

### 6. Setup Frontend

**Terminal 2 - Frontend:**
```bash
# Abra um novo terminal: Ctrl + Shift + `
cd frontend
npm install
npm start
```

## 📂 Estrutura no VS Code

```
CARTORIO-APP/
│
├── 📁 backend/
│   ├── 📁 config/
│   │   ├── database.js      ← Conexão PostgreSQL
│   │   └── init.sql         ← Script do banco
│   ├── 📁 routes/
│   │   ├── auth.js          ← Login/Registro
│   │   ├── protocolos.js    ← CRUD Protocolos
│   │   ├── servicos.js      ← CRUD Serviços
│   │   ├── funcionarios.js  ← CRUD Funcionários
│   │   ├── feriados.js      ← CRUD Feriados
│   │   └── relatorios.js    ← Relatórios/Stats
│   ├── 📁 middleware/
│   │   └── auth.js          ← Autenticação JWT
│   ├── server.js            ← ⭐ Servidor Principal
│   ├── .env.example         ← Configurações
│   └── package.json
│
├── 📁 frontend/
│   ├── 📁 public/
│   │   └── index.html
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   └── Sidebar.jsx
│   │   ├── 📁 pages/
│   │   │   └── Login.jsx    ← ⭐ Adicione mais páginas aqui
│   │   ├── 📁 services/
│   │   │   └── api.js       ← ⭐ Chamadas API
│   │   ├── 📁 styles/
│   │   │   ├── App.css
│   │   │   ├── Login.css
│   │   │   └── Sidebar.css
│   │   ├── App.jsx          ← ⭐ App Principal
│   │   └── index.js
│   └── package.json
│
├── README.md                ← 📖 Documentação Completa
├── INICIO-RAPIDO.md         ← 🚀 Setup Rápido
└── .gitignore
```

## 🎯 Arquivos Importantes

### ⭐ Backend
- `backend/server.js` - Ponto de entrada do servidor
- `backend/routes/*.js` - Todas as rotas da API
- `backend/config/init.sql` - Estrutura do banco de dados

### ⭐ Frontend
- `frontend/src/App.jsx` - Componente raiz
- `frontend/src/services/api.js` - Integração com backend
- `frontend/src/pages/` - Adicione novas páginas aqui

## 📝 Comandos Úteis no Terminal

### Backend
```bash
npm run dev      # Inicia servidor em modo desenvolvimento
npm start        # Inicia servidor em produção
```

### Frontend
```bash
npm start        # Inicia React em localhost:3000
npm run build    # Gera build para produção
```

### Banco de Dados
```bash
# Conectar ao PostgreSQL
psql -U postgres

# Executar script de inicialização
psql -U postgres -d cartorio_db -f backend/config/init.sql

# Ver tabelas
\dt

# Sair
\q
```

## 🔍 Debug no VS Code

### 1. Criar `.vscode/launch.json`
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Backend",
      "program": "${workspaceFolder}/backend/server.js",
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

### 2. Usar Breakpoints
- Clique na margem esquerda do código
- F5 para iniciar debug
- F9 para adicionar/remover breakpoint
- F10 para step over
- F11 para step into

## 🧪 Testar API

### Opção 1: Extensão REST Client
Crie arquivo `test.http` na raiz:

```http
### Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@cartorio.com",
  "senha": "admin123"
}

### Listar Protocolos
GET http://localhost:5000/api/protocolos
Authorization: Bearer SEU_TOKEN_AQUI
```

### Opção 2: Postman ou Insomnia
Importe as rotas manualmente

## 🎨 Personalizar

### Cores (CSS)
Edite `frontend/src/styles/App.css`:
```css
:root {
  --primary: #1a4d2e;      /* Verde principal */
  --accent: #d4af37;        /* Dourado */
  /* Mude as cores aqui */
}
```

### Adicionar Nova Página
1. Crie `frontend/src/pages/MinhaPage.jsx`
2. Adicione rota em `App.jsx`:
```jsx
<Route path="/minha-page" element={<MinhaPage />} />
```
3. Adicione menu no `Sidebar.jsx`

## ⚡ Atalhos VS Code Úteis

- `Ctrl + P` - Buscar arquivo
- `Ctrl + Shift + P` - Command Palette
- `Ctrl + B` - Toggle Sidebar
- ``Ctrl + ` `` - Toggle Terminal
- `Ctrl + /` - Comentar linha
- `Alt + Shift + F` - Formatar código
- `F2` - Renomear símbolo
- `Ctrl + D` - Selecionar próxima ocorrência

## 🆘 Problemas Comuns

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Porta já em uso
```bash
# Matar processo na porta 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### Erro no PostgreSQL
```bash
# Verificar status
sudo systemctl status postgresql

# Iniciar
sudo systemctl start postgresql
```

## 📚 Próximos Passos

1. ✅ Abra o projeto no VS Code
2. ✅ Configure o banco de dados
3. ✅ Instale dependências (backend e frontend)
4. ✅ Inicie os servidores
5. ✅ Acesse http://localhost:3000
6. 🚀 Comece a desenvolver!

## 💡 Dicas

- Use o terminal integrado do VS Code
- Ative o Auto Save (File > Auto Save)
- Use Git para versionar seu código
- Instale Prettier para formatação automática

---

**Bom desenvolvimento! 🎉**
