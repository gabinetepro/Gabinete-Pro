-- ============================================================
-- Gabinete Pro — Migração 002: Monitor de Pautas
-- Executar no SQL Editor do Supabase
-- ============================================================

-- Adicionar colunas de perfil político na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interesses TEXT[] DEFAULT '{}';

-- Adicionar novos campos na tabela pautas
ALTER TABLE public.pautas ADD COLUMN IF NOT EXISTS relevancia TEXT DEFAULT 'Média';
ALTER TABLE public.pautas ADD COLUMN IF NOT EXISTS sugestao_acao TEXT;
ALTER TABLE public.pautas ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
