-- Adiciona a flag "aparece no Balcão de Atendimento" aos tipos de serviço.
-- Serviços existentes ficam visíveis por padrão (true) — não muda o comportamento atual.
--
-- Execute manualmente no banco já existente:
--   psql -U postgres -d cartorio_db -f backend/migrations/003_visivel_atendimento.sql
-- ou, via docker:
--   cat backend/migrations/003_visivel_atendimento.sql | docker exec -i cartorio-db psql -U postgres -d cartorio_db
--
-- Idempotente: pode ser executado mais de uma vez sem erro.

ALTER TABLE servicos ADD COLUMN IF NOT EXISTS visivel_atendimento boolean NOT NULL DEFAULT true;
