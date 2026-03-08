-- PlantaoBot subscriptions table
-- Tracks Stripe plan assignments per user.
-- Run this migration once in your Supabase SQL editor.

create table if not exists public.subscriptions (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        not null references auth.users(id) on delete cascade,
  plan_id                 text        not null default 'free',
  stripe_customer_id      text,
  stripe_subscription_id  text,
  stripe_status           text,
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (user_id)
);

alter table public.subscriptions enable row level security;

-- Users can only read their own subscription row.
-- All writes happen through the service role (backend).
create policy "Users read own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- Index for Stripe webhook lookups by subscription ID
create index if not exists idx_subscriptions_stripe_subscription_id
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Index for portal session lookups by customer ID
create index if not exists idx_subscriptions_stripe_customer_id
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;
