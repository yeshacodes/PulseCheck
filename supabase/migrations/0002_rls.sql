-- Row-level security. A user may only touch their own data; the public status
-- page gets a narrow read-only window into monitors flagged `is_public`.
-- The service-role key (cron worker, seed script) bypasses all of this.

alter table public.profiles       enable row level security;
alter table public.monitors       enable row level security;
alter table public.monitor_checks enable row level security;
alter table public.incidents      enable row level security;

-- ------------------------------- profiles --------------------------------
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Public status pages need to resolve a slug -> workspace name without a login.
create policy "profiles: public slug lookup"
  on public.profiles for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.monitors m
      where m.user_id = profiles.id and m.is_public
    )
  );

-- ------------------------------- monitors --------------------------------
create policy "monitors: owner full access"
  on public.monitors for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "monitors: public read"
  on public.monitors for select
  to anon, authenticated
  using (is_public);

-- ---------------------------- monitor_checks ----------------------------
create policy "checks: owner read"
  on public.monitor_checks for select
  using (
    exists (
      select 1 from public.monitors m
      where m.id = monitor_checks.monitor_id and m.user_id = auth.uid()
    )
  );

create policy "checks: owner insert"
  on public.monitor_checks for insert
  with check (
    exists (
      select 1 from public.monitors m
      where m.id = monitor_checks.monitor_id and m.user_id = auth.uid()
    )
  );

create policy "checks: public read"
  on public.monitor_checks for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.monitors m
      where m.id = monitor_checks.monitor_id and m.is_public
    )
  );

-- ------------------------------- incidents ------------------------------
create policy "incidents: owner read"
  on public.incidents for select
  using (
    exists (
      select 1 from public.monitors m
      where m.id = incidents.monitor_id and m.user_id = auth.uid()
    )
  );

create policy "incidents: owner write"
  on public.incidents for all
  using (
    exists (
      select 1 from public.monitors m
      where m.id = incidents.monitor_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.monitors m
      where m.id = incidents.monitor_id and m.user_id = auth.uid()
    )
  );

create policy "incidents: public read"
  on public.incidents for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.monitors m
      where m.id = incidents.monitor_id and m.is_public
    )
  );
