-- ============================================================
-- Gabinete Pro — Migração 006: Kanban – novos campos em conteudos
-- Executar no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.conteudos
  ADD COLUMN IF NOT EXISTS data_veiculacao DATE,
  ADD COLUMN IF NOT EXISTS anexo_url       TEXT,
  ADD COLUMN IF NOT EXISTS criado_por      TEXT,
  ADD COLUMN IF NOT EXISTS historico       JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS conteudos_data_veiculacao_idx ON public.conteudos(data_veiculacao);
CREATE INDEX IF NOT EXISTS conteudos_status_idx          ON public.conteudos(status);
