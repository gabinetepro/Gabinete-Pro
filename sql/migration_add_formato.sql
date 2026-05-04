-- Migration: adiciona coluna formato à tabela conteudos
-- Execute no SQL Editor do Supabase

ALTER TABLE public.conteudos
  ADD COLUMN IF NOT EXISTS formato text;
