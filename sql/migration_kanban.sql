-- Migration: adiciona status 'aprovado' ao kanban
-- Execute no SQL Editor do Supabase

ALTER TABLE public.conteudos
  DROP CONSTRAINT IF EXISTS conteudos_status_check;

ALTER TABLE public.conteudos
  ADD CONSTRAINT conteudos_status_check
  CHECK (status IN ('rascunho', 'revisao', 'aprovado', 'publicado'));
