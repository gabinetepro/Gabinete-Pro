-- ── EVENTOS ──────────────────────────────────────────────────────
-- Execute no SQL Editor do Supabase

create table if not exists public.eventos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  titulo        text not null,
  tipo          text not null default 'outro'
                  check (tipo in ('reuniao','audiencia_publica','visita','sessao','evento','outro')),
  data          date not null,
  hora_inicio   time,
  hora_fim      time,
  local         text,
  descricao     text,
  participantes text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists eventos_user_id_idx on public.eventos(user_id);
create index if not exists eventos_data_idx    on public.eventos(data);

alter table public.eventos enable row level security;

create policy "Usuário gerencia próprios eventos"
  on public.eventos for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger eventos_updated_at
  before update on public.eventos
  for each row execute function public.set_updated_at();
