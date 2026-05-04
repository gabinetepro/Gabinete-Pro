-- ============================================================
-- Gabinete Pro — Migração 004: Gestão de Equipe
-- Executar no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.membros_equipe (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_user_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membro_user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  nome              TEXT        NOT NULL,
  email             TEXT        NOT NULL,
  cargo             TEXT        NOT NULL DEFAULT 'Assessor',
  telefone          TEXT,
  permissoes        JSONB       NOT NULL DEFAULT '{
    "ver_dashboard": true,
    "gerenciar_eleitores": false,
    "criar_conteudo": false,
    "ver_agenda": true,
    "ver_pautas": true
  }'::jsonb,
  status            TEXT        NOT NULL DEFAULT 'pendente'
                                CHECK (status IN ('ativo', 'inativo', 'pendente')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (gabinete_user_id, email)
);

CREATE INDEX IF NOT EXISTS membros_equipe_gabinete_idx ON public.membros_equipe(gabinete_user_id);
CREATE INDEX IF NOT EXISTS membros_equipe_status_idx   ON public.membros_equipe(status);
CREATE INDEX IF NOT EXISTS membros_equipe_email_idx    ON public.membros_equipe(email);

-- ── Row Level Security ────────────────────────────────────────────────────

ALTER TABLE public.membros_equipe ENABLE ROW LEVEL SECURITY;

-- Dono do gabinete gerencia todos os membros do seu gabinete
CREATE POLICY "Dono gerencia equipe"
  ON public.membros_equipe FOR ALL
  USING  (auth.uid() = gabinete_user_id)
  WITH CHECK (auth.uid() = gabinete_user_id);

-- Membro pode ver seu próprio registro
CREATE POLICY "Membro vê próprio registro"
  ON public.membros_equipe FOR SELECT
  USING (auth.uid() = membro_user_id);

-- ── Ligar membro_user_id quando o convidado aceitar ───────────────────────
-- Quando o usuário aceitar o convite e fizer login, vincular o membro_user_id
-- ao registro correspondente via trigger ou chamada na callback de auth.

CREATE OR REPLACE FUNCTION public.link_membro_on_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.membros_equipe
    SET membro_user_id = NEW.id,
        status         = 'ativo'
  WHERE email         = NEW.email
    AND membro_user_id IS NULL
    AND status        = 'pendente';
  RETURN NEW;
END;
$$;

-- Dispara na inserção de um novo usuário (primeiro login após aceitar convite)
DROP TRIGGER IF EXISTS trg_link_membro_on_login ON auth.users;
CREATE TRIGGER trg_link_membro_on_login
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_membro_on_login();
