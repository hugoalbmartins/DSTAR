
/*
  # Criar Cron Job de Keep-Alive

  ## Objetivo
  Manter a base de dados sempre ativa, prevenindo que adormeça por inatividade.

  ## O que faz
  - Ativa a extensão pg_cron
  - Cria uma tabela de registo de keep-alive (db_keepalive_log)
  - Agenda um job a cada hora que escreve um timestamp na tabela de registo
  - A escrita periódica garante atividade constante na base de dados

  ## Notas
  - O job executa de hora em hora (a cada 60 minutos)
  - Mantém apenas os últimos 100 registos para não crescer indefinidamente
*/

-- Ativar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar tabela de registo de keep-alive
CREATE TABLE IF NOT EXISTS db_keepalive_log (
  id bigserial PRIMARY KEY,
  pinged_at timestamptz DEFAULT now() NOT NULL
);

-- RLS na tabela de keep-alive
ALTER TABLE db_keepalive_log ENABLE ROW LEVEL SECURITY;

-- Remover job anterior se existir
SELECT cron.unschedule('db-keepalive') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'db-keepalive'
);

-- Criar job que corre a cada hora
SELECT cron.schedule(
  'db-keepalive',
  '0 * * * *',
  $$
    INSERT INTO public.db_keepalive_log (pinged_at) VALUES (now());
    DELETE FROM public.db_keepalive_log
    WHERE id NOT IN (
      SELECT id FROM public.db_keepalive_log ORDER BY pinged_at DESC LIMIT 100
    );
  $$
);
