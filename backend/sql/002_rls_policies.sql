-- PlantaoBot: Row Level Security policies
-- Execute AFTER 001_auth_and_operational_schema.sql
-- Each user can only read and write their own data.

-- ── profiles ─────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "profiles: own read"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: own insert"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles: own update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── preferences ──────────────────────────────────────────────────────────────
alter table public.preferences enable row level security;

create policy "preferences: own read"
  on public.preferences for select
  using (user_id = auth.uid());

create policy "preferences: own insert"
  on public.preferences for insert
  with check (user_id = auth.uid());

create policy "preferences: own update"
  on public.preferences for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── groups ───────────────────────────────────────────────────────────────────
alter table public.groups enable row level security;

create policy "groups: own read"
  on public.groups for select
  using (user_id = auth.uid());

create policy "groups: own insert"
  on public.groups for insert
  with check (user_id = auth.uid());

create policy "groups: own update"
  on public.groups for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "groups: own delete"
  on public.groups for delete
  using (user_id = auth.uid());

-- ── captures ─────────────────────────────────────────────────────────────────
alter table public.captures enable row level security;

create policy "captures: own read"
  on public.captures for select
  using (user_id = auth.uid());

create policy "captures: own insert"
  on public.captures for insert
  with check (user_id = auth.uid());

create policy "captures: own delete"
  on public.captures for delete
  using (user_id = auth.uid());

-- ── rejections ───────────────────────────────────────────────────────────────
alter table public.rejections enable row level security;

create policy "rejections: own read"
  on public.rejections for select
  using (user_id = auth.uid());

create policy "rejections: own insert"
  on public.rejections for insert
  with check (user_id = auth.uid());

create policy "rejections: own delete"
  on public.rejections for delete
  using (user_id = auth.uid());

-- ── monitor_sessions ─────────────────────────────────────────────────────────
alter table public.monitor_sessions enable row level security;

create policy "monitor_sessions: own read"
  on public.monitor_sessions for select
  using (user_id = auth.uid());

create policy "monitor_sessions: own insert"
  on public.monitor_sessions for insert
  with check (user_id = auth.uid());

create policy "monitor_sessions: own update"
  on public.monitor_sessions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── events ───────────────────────────────────────────────────────────────────
alter table public.events enable row level security;

create policy "events: own read"
  on public.events for select
  using (user_id = auth.uid());

create policy "events: own insert"
  on public.events for insert
  with check (user_id = auth.uid());
