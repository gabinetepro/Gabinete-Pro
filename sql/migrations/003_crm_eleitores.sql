-- ============================================================
-- Gabinete Pro — Migração 003: CRM de Eleitores completo
-- Executar no SQL Editor do Supabase
-- ============================================================

-- Adicionar novas colunas na tabela eleitores
ALTER TABLE public.eleitores
  ADD COLUMN IF NOT EXISTS whatsapp          TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento   DATE,
  ADD COLUMN IF NOT EXISTS genero            TEXT,
  ADD COLUMN IF NOT EXISTS profissao         TEXT,
  ADD COLUMN IF NOT EXISTS escolaridade      TEXT,
  ADD COLUMN IF NOT EXISTS faixa_renda       TEXT,
  ADD COLUMN IF NOT EXISTS cep               TEXT,
  ADD COLUMN IF NOT EXISTS rua               TEXT,
  ADD COLUMN IF NOT EXISTS numero            TEXT,
  ADD COLUMN IF NOT EXISTS complemento       TEXT,
  ADD COLUMN IF NOT EXISTS como_conheceu     TEXT,
  ADD COLUMN IF NOT EXISTS ja_votou          TEXT,
  ADD COLUMN IF NOT EXISTS intencao_voto     TEXT,
  ADD COLUMN IF NOT EXISTS engajamento       TEXT DEFAULT 'Apoiador passivo',
  ADD COLUMN IF NOT EXISTS temas_interesse   TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS aceita_comunicados BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferencia_contato TEXT,
  ADD COLUMN IF NOT EXISTS tags              TEXT[] DEFAULT '{}';

-- Índices adicionais para filtros comuns
CREATE INDEX IF NOT EXISTS eleitores_cidade_idx      ON public.eleitores(cidade);
CREATE INDEX IF NOT EXISTS eleitores_engajamento_idx ON public.eleitores(engajamento);
CREATE INDEX IF NOT EXISTS eleitores_intencao_idx    ON public.eleitores(intencao_voto);

-- Tabela de interações com eleitor
CREATE TABLE IF NOT EXISTS public.interacoes_eleitor (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleitor_id  UUID NOT NULL REFERENCES public.eleitores(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS interacoes_eleitor_eleitor_id_idx ON public.interacoes_eleitor(eleitor_id);
CREATE INDEX IF NOT EXISTS interacoes_eleitor_created_at_idx ON public.interacoes_eleitor(created_at DESC);

ALTER TABLE public.interacoes_eleitor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia próprias interações"
  ON public.interacoes_eleitor FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at para interacoes
CREATE TRIGGER interacoes_eleitor_updated_at
  BEFORE UPDATE ON public.interacoes_eleitor
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
