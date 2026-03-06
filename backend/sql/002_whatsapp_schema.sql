-- WhatsApp integration schema for PlantaoBot

-- Stores incoming WhatsApp messages (raw + parsed offer)
create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id text,
  jid text,
  group_name text,
  sender_name text,
  raw_text text not null,
  is_offer boolean not null default false,
  offer jsonb,
  received_at timestamptz not null default now(),
  -- Deduplicate by (user_id, message_id) when message_id is present
  constraint whatsapp_messages_user_msgid_unique unique nulls not distinct (user_id, message_id)
);

create index if not exists idx_whatsapp_messages_user_received
  on public.whatsapp_messages (user_id, received_at asc);

-- Stores per-user WhatsApp webhook configuration
create table if not exists public.whatsapp_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  webhook_token text not null default gen_random_uuid()::text,
  instance_id text,
  phone_number text,
  connected boolean not null default false,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.whatsapp_messages enable row level security;
alter table public.whatsapp_config enable row level security;

-- Policies: users can only access their own data
create policy if not exists "whatsapp_messages_owner"
  on public.whatsapp_messages
  for all
  using (auth.uid() = user_id);

create policy if not exists "whatsapp_config_owner"
  on public.whatsapp_config
  for all
  using (auth.uid() = user_id);
