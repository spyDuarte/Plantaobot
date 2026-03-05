-- PlantaoBot auth + operational schema (Supabase/Postgres)

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  bootstrap_imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id text not null,
  name text not null,
  members integer not null default 0,
  active boolean not null default true,
  emoji text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, group_id)
);

create table if not exists public.captures (
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_id text not null,
  offer jsonb not null,
  source text,
  session_id text,
  created_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

create table if not exists public.rejections (
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_id text not null,
  offer jsonb not null,
  reason text,
  session_id text,
  created_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

create table if not exists public.monitor_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_id text,
  active boolean not null default false,
  cursor text,
  groups jsonb not null default '[]'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  operator_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_events_user_id on public.events (user_id);
create index if not exists idx_events_name on public.events (name);
create index if not exists idx_captures_created_at on public.captures (created_at desc);
create index if not exists idx_rejections_created_at on public.rejections (created_at desc);
