-- ============================================================
-- Gabinete Pro — Migração 007: Página pública de demandas
-- Executar no SQL Editor do Supabase
-- ============================================================

-- ── Coluna slug em profiles ────────────────────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS profiles_slug_idx ON public.profiles(slug);

-- Política para leitura pública de perfis com slug (página do político)
CREATE POLICY "Perfil público visível por slug"
  ON public.profiles FOR SELECT
  USING (slug IS NOT NULL);

-- ── Tabela de demandas públicas ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.demandas_publicas (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  politico_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocolo        TEXT        NOT NULL UNIQUE,
  nome             TEXT        NOT NULL,
  email            TEXT        NOT NULL,
  telefone         TEXT,
  bairro           TEXT,
  tipo             TEXT        NOT NULL CHECK (tipo IN ('recado','duvida','sugestao','demanda')),
  categoria        TEXT        NOT NULL,
  mensagem         TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'nova'
                               CHECK (status IN ('nova','em_analise','respondida','arquivada')),
  resposta         TEXT,
  respondido_em    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demandas_politico_idx  ON public.demandas_publicas(politico_user_id);
CREATE INDEX IF NOT EXISTS demandas_status_idx    ON public.demandas_publicas(status);
CREATE INDEX IF NOT EXISTS demandas_created_idx   ON public.demandas_publicas(created_at DESC);

-- ── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE public.demandas_publicas ENABLE ROW LEVEL SECURITY;

-- Inserção pública: qualquer pessoa pode enviar uma demanda
CREATE POLICY "Inserção pública de demandas"
  ON public.demandas_publicas FOR INSERT
  WITH CHECK (true);

-- Leitura: apenas o político dono
CREATE POLICY "Político lê próprias demandas"
  ON public.demandas_publicas FOR SELECT
  USING (auth.uid() = politico_user_id);

-- Atualização: apenas o político dono (status, resposta)
CREATE POLICY "Político atualiza próprias demandas"
  ON public.demandas_publicas FOR UPDATE
  USING (auth.uid() = politico_user_id);

-- Exclusão: apenas o político dono
CREATE POLICY "Político remove próprias demandas"
  ON public.demandas_publicas FOR DELETE
  USING (auth.uid() = politico_user_id);

-- ── Gerar slug automaticamente ao inserir/atualizar profiles ──────────────

CREATE OR REPLACE FUNCTION public.generate_slug(nome TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Remove acentos e converte para minúsculas
  base_slug := lower(
    regexp_replace(
      translate(nome,
        'áàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ',
        'aaaaaaeeeeiiiiooooouuuucnaaaaaaeeeeiiiiooooouuuucn'
      ),
      '[^a-z0-9\s-]', '', 'g'
    )
  );
  base_slug := regexp_replace(trim(base_slug), '\s+', '-', 'g');
  final_slug := base_slug;

  -- Garante unicidade
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;
