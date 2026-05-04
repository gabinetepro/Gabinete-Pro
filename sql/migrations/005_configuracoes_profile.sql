-- ============================================================
-- Gabinete Pro — Migração 005: Perfil completo + Configurações
-- Executar no SQL Editor do Supabase
-- ============================================================

-- ── Perfil do político ────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nome_politico       TEXT,
  ADD COLUMN IF NOT EXISTS partido             TEXT,
  -- cargo já existe da migração 002
  ADD COLUMN IF NOT EXISTS biografia           TEXT,
  ADD COLUMN IF NOT EXISTS site                TEXT,

  -- Redes sociais
  ADD COLUMN IF NOT EXISTS instagram           TEXT,
  ADD COLUMN IF NOT EXISTS facebook            TEXT,
  ADD COLUMN IF NOT EXISTS twitter             TEXT,
  ADD COLUMN IF NOT EXISTS youtube             TEXT,
  ADD COLUMN IF NOT EXISTS tiktok              TEXT,

  -- Tom de voz e estilo (usado pelo Estúdio de Conteúdo)
  ADD COLUMN IF NOT EXISTS tom_voz             TEXT,
  ADD COLUMN IF NOT EXISTS estilos_comunicacao JSONB  NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS texto_referencia    TEXT,

  -- Dados do gabinete
  ADD COLUMN IF NOT EXISTS nome_gabinete       TEXT,
  ADD COLUMN IF NOT EXISTS endereco_gabinete   TEXT,
  ADD COLUMN IF NOT EXISTS telefone_gabinete   TEXT,
  ADD COLUMN IF NOT EXISTS email_gabinete      TEXT,
  ADD COLUMN IF NOT EXISTS horario_gabinete    TEXT,

  -- Notificações
  ADD COLUMN IF NOT EXISTS notif_demandas      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_resumo        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_pautas        BOOLEAN NOT NULL DEFAULT true,

  -- Fotos (URLs do Supabase Storage)
  ADD COLUMN IF NOT EXISTS avatar_url          TEXT,
  ADD COLUMN IF NOT EXISTS foto_gabinete_url   TEXT;

-- ── Storage bucket para mídias do gabinete ────────────────────────────────
-- Cria o bucket público "gabinete-media" para fotos de perfil e gabinete.
-- Se já existir, o INSERT é ignorado pelo ON CONFLICT.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gabinete-media',
  'gabinete-media',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS: usuário sobe/lê apenas dentro da própria pasta ───────────

CREATE POLICY "Usuário sobe própria mídia"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gabinete-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Usuário atualiza própria mídia"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gabinete-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Leitura pública de mídias"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gabinete-media');

-- ── Índices úteis ─────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS profiles_plano_idx  ON public.profiles(plano);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles(status);
