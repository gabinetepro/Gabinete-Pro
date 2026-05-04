-- ============================================================
-- Gabinete Pro — Tabelas de negócio
-- Executar no SQL Editor do Supabase após schema.sql
-- ============================================================

-- ── ELEITORES ────────────────────────────────────────────────
create table if not exists public.eleitores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nome       text not null,
  email      text,
  telefone   text,
  bairro     text,
  cidade     text,
  uf         char(2),
  observacao text,
  status     text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists eleitores_user_id_idx on public.eleitores(user_id);
create index if not exists eleitores_created_at_idx on public.eleitores(created_at desc);

alter table public.eleitores enable row level security;

create policy "Usuário gerencia próprios eleitores"
  on public.eleitores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── CONTEÚDOS ────────────────────────────────────────────────
create table if not exists public.conteudos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  titulo     text not null,
  tipo       text not null default 'post'
               check (tipo in ('post', 'nota', 'pronunciamento', 'release')),
  conteudo   text,
  status     text not null default 'rascunho'
               check (status in ('rascunho', 'revisao', 'publicado')),
  canal      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conteudos_user_id_idx on public.conteudos(user_id);
create index if not exists conteudos_created_at_idx on public.conteudos(created_at desc);

alter table public.conteudos enable row level security;

create policy "Usuário gerencia próprios conteúdos"
  on public.conteudos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── DEMANDAS ─────────────────────────────────────────────────
create table if not exists public.demandas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  eleitor_id  uuid references public.eleitores(id) on delete set null,
  titulo      text not null,
  descricao   text,
  status      text not null default 'aberta'
                check (status in ('aberta', 'em_andamento', 'resolvida', 'cancelada')),
  prioridade  text not null default 'media'
                check (prioridade in ('baixa', 'media', 'alta', 'urgente')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists demandas_user_id_idx on public.demandas(user_id);
create index if not exists demandas_status_idx on public.demandas(status);
create index if not exists demandas_created_at_idx on public.demandas(created_at desc);

alter table public.demandas enable row level security;

create policy "Usuário gerencia próprias demandas"
  on public.demandas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── PAUTAS ───────────────────────────────────────────────────
create table if not exists public.pautas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  titulo     text not null,
  descricao  text,
  categoria  text,
  fonte      text,
  status     text not null default 'ativa'
               check (status in ('ativa', 'arquivada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pautas_user_id_idx on public.pautas(user_id);
create index if not exists pautas_status_idx on public.pautas(status);

alter table public.pautas enable row level security;

create policy "Usuário gerencia próprias pautas"
  on public.pautas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Triggers updated_at para todas as tabelas ────────────────
create trigger eleitores_updated_at
  before update on public.eleitores
  for each row execute function public.set_updated_at();

create trigger conteudos_updated_at
  before update on public.conteudos
  for each row execute function public.set_updated_at();

create trigger demandas_updated_at
  before update on public.demandas
  for each row execute function public.set_updated_at();

create trigger pautas_updated_at
  before update on public.pautas
  for each row execute function public.set_updated_at();
