# Makefile para comandos Docker do Sistema de Cartório

.PHONY: help build up down logs restart clean backup restore shell-backend shell-frontend shell-db

# Variáveis
COMPOSE_FILE=docker-compose.yml
COMPOSE_DEV_FILE=docker-compose.dev.yml

help: ## Mostra este menu de ajuda
	@echo "Sistema de Cartório - Comandos Docker"
	@echo ""
	@echo "Uso: make [comando]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Constrói as imagens Docker
	docker-compose -f $(COMPOSE_FILE) build

up: ## Inicia todos os containers em background
	docker-compose -f $(COMPOSE_FILE) up -d

down: ## Para todos os containers
	docker-compose -f $(COMPOSE_FILE) down

logs: ## Mostra logs de todos os containers
	docker-compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## Mostra logs apenas do backend
	docker-compose -f $(COMPOSE_FILE) logs -f backend

logs-frontend: ## Mostra logs apenas do frontend
	docker-compose -f $(COMPOSE_FILE) logs -f frontend

logs-db: ## Mostra logs apenas do banco de dados
	docker-compose -f $(COMPOSE_FILE) logs -f postgres

restart: ## Reinicia todos os containers
	docker-compose -f $(COMPOSE_FILE) restart

restart-backend: ## Reinicia apenas o backend
	docker-compose -f $(COMPOSE_FILE) restart backend

restart-frontend: ## Reinicia apenas o frontend
	docker-compose -f $(COMPOSE_FILE) restart frontend

ps: ## Lista status dos containers
	docker-compose -f $(COMPOSE_FILE) ps

clean: ## Para e remove containers, redes e volumes
	docker-compose -f $(COMPOSE_FILE) down -v

rebuild: ## Reconstrói e reinicia todos os containers
	docker-compose -f $(COMPOSE_FILE) up -d --build

shell-backend: ## Acessa shell do container backend
	docker-compose -f $(COMPOSE_FILE) exec backend sh

shell-frontend: ## Acessa shell do container frontend
	docker-compose -f $(COMPOSE_FILE) exec frontend sh

shell-db: ## Acessa psql do PostgreSQL
	docker-compose -f $(COMPOSE_FILE) exec postgres psql -U cartorio_user -d cartorio_db

backup: ## Cria backup do banco de dados
	@mkdir -p backups
	docker-compose -f $(COMPOSE_FILE) exec postgres pg_dump -U cartorio_user cartorio_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup criado em backups/"

restore: ## Restaura backup do banco (usage: make restore FILE=backups/backup.sql)
	@if [ -z "$(FILE)" ]; then echo "Uso: make restore FILE=backups/backup_YYYYMMDD_HHMMSS.sql"; exit 1; fi
	cat $(FILE) | docker-compose -f $(COMPOSE_FILE) exec -T postgres psql -U cartorio_user -d cartorio_db
	@echo "Backup restaurado com sucesso!"

stats: ## Mostra estatísticas de uso dos containers
	docker stats

dev-up: ## Inicia ambiente de desenvolvimento
	docker-compose -f $(COMPOSE_DEV_FILE) up -d

dev-down: ## Para ambiente de desenvolvimento
	docker-compose -f $(COMPOSE_DEV_FILE) down

dev-logs: ## Logs do ambiente de desenvolvimento
	docker-compose -f $(COMPOSE_DEV_FILE) logs -f

install: ## Primeira instalação (cria .env e inicia containers)
	@if [ ! -f .env ]; then cp .env.example .env; echo "Arquivo .env criado. Edite as configurações antes de continuar."; else echo ".env já existe."; fi
	@echo "Execute 'make up' para iniciar os containers"

health: ## Verifica saúde dos serviços
	@echo "Verificando saúde dos serviços..."
	@curl -s http://localhost:5000/api/health && echo "✅ Backend OK" || echo "❌ Backend com problemas"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend com problemas"
	@docker-compose -f $(COMPOSE_FILE) exec postgres pg_isready -U cartorio_user && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL com problemas"
