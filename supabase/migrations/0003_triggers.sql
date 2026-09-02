-- Auto-create a profile (with a unique public status-page slug) whenever a new
-- auth user is created.

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(lower(coalesce(nullif(input, ''), 'workspace')), '[^a-z0-9]+', '-', 'g')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
  suffix    text;
begin
  base_slug := left(coalesce(nullif(slugify(new.raw_user_meta_data ->> 'full_name'), ''), 'workspace'), 40);
  candidate := base_slug;

  -- Append a short random suffix until the slug is unique.
  for i in 1..20 loop
    exit when not exists (select 1 from public.profiles where status_page_slug = candidate);
    suffix := substr(encode(gen_random_bytes(4), 'hex'), 1, 6);
    candidate := base_slug || '-' || suffix;
  end loop;

  insert into public.profiles (id, full_name, status_page_slug)
  values (new.id, new.raw_user_meta_data ->> 'full_name', candidate);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
