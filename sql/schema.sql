-- ============================================================
-- Gabinete Pro — Schema principal
-- Executar no SQL Editor do Supabase
-- ============================================================

-- Tabela de perfis (vinculada ao auth.users do Supabase)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  nome        text not null default '',
  plano       text not null default 'trial' check (plano in ('solo', 'assessor', 'gabinete', 'trial')),
  status      text not null default 'trial' check (status in ('ativo', 'inativo', 'trial')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Índice para busca por email (webhook da Kiwify busca por email)
create index if not exists profiles_email_idx on public.profiles(email);

-- ── Row Level Security ──────────────────────────────────────
alter table public.profiles enable row level security;

-- Usuário lê e atualiza apenas o próprio perfil
create policy "Usuário lê próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário atualiza próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Service role ignora RLS (usado no webhook da Kiwify)
-- (service role key ignora RLS por padrão no Supabase)

-- ── Trigger: criar perfil automaticamente no signup ─────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome, plano, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    'trial',
    'trial'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Trigger: updated_at automático ──────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
