-- PulseCheck Phase 1 schema.
-- Run this in the Supabase SQL editor (or `supabase db push`) before starting the app.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user (created by the trigger in 0003)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  full_name        text,
  status_page_slug text not null unique,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- monitors: a website / API endpoint the user wants watched
-- ---------------------------------------------------------------------------
create table if not exists public.monitors (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 80),
  url              text not null check (char_length(url) between 1 and 2048),
  expected_status  int  not null default 200 check (expected_status between 100 and 599),
  timeout_ms       int  not null default 10000 check (timeout_ms between 1000 and 30000),
  current_status   text not null default 'pending' check (current_status in ('pending', 'up', 'down')),
  last_response_ms int,
  last_checked_at  timestamptz,
  is_public        boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists monitors_user_id_idx on public.monitors (user_id);
create index if not exists monitors_public_idx on public.monitors (is_public) where is_public;
create index if not exists monitors_due_idx on public.monitors (last_checked_at nulls first);

-- ---------------------------------------------------------------------------
-- monitor_checks: the result of every individual check
-- ---------------------------------------------------------------------------
create table if not exists public.monitor_checks (
  id            uuid primary key default gen_random_uuid(),
  monitor_id    uuid not null references public.monitors (id) on delete cascade,
  status        text not null check (status in ('up', 'down')),
  status_code   int,
  response_ms   int,
  error_message text,
  checked_at    timestamptz not null default now()
);

create index if not exists monitor_checks_monitor_time_idx
  on public.monitor_checks (monitor_id, checked_at desc);

-- ---------------------------------------------------------------------------
-- incidents: an open/closed failure window for a monitor
-- ---------------------------------------------------------------------------
create table if not exists public.incidents (
  id             uuid primary key default gen_random_uuid(),
  monitor_id     uuid not null references public.monitors (id) on delete cascade,
  started_at     timestamptz not null,
  resolved_at    timestamptz,
  status         text not null check (status in ('active', 'resolved')),
  failure_reason text
);

create index if not exists incidents_monitor_idx on public.incidents (monitor_id, started_at desc);

-- At most one active incident per monitor.
create unique index if not exists incidents_one_active_per_monitor
  on public.incidents (monitor_id) where status = 'active';
