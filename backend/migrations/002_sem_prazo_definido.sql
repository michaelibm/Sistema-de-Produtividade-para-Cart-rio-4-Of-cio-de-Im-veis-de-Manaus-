-- Adiciona a opção "sem_prazo" (sem prazo definido) para o tipo_prazo dos serviços
-- e permite que protocolos.data_vencimento fique em branco quando o serviço não tem prazo.
--
-- Execute manualmente no banco já existente:
--   psql -U postgres -d cartorio_db -f backend/migrations/002_sem_prazo_definido.sql
-- ou, via docker:
--   docker exec -i <container_postgres> psql -U postgres -d cartorio_db < backend/migrations/002_sem_prazo_definido.sql
--
-- Idempotente: pode ser executado mais de uma vez sem erro.

ALTER TABLE servicos DROP CONSTRAINT IF EXISTS servicos_tipo_prazo_check;
ALTER TABLE servicos ADD CONSTRAINT servicos_tipo_prazo_check
    CHECK (tipo_prazo IN ('uteis', 'corridos', 'sem_prazo'));

ALTER TABLE servicos ALTER COLUMN prazo DROP NOT NULL;

ALTER TABLE protocolos ALTER COLUMN data_vencimento DROP NOT NULL;
