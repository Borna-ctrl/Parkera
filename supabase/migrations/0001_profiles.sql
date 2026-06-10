-- Fas 1: profiles + auto-trigger + RLS
-- En profilrad per användare, kopplad 1:1 till auth.users.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiler är publikt läsbara (ägarnamn visas på annonser och i chatt).
create policy "Profiler är läsbara för alla"
  on public.profiles
  for select
  using (true);

-- Användare får bara uppdatera sin egen profil.
create policy "Användare kan uppdatera sin egen profil"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Skapa profilrad automatiskt när en ny auth.users-rad skapas.
-- SECURITY DEFINER så insert sker oavsett RLS; tom search_path enligt Supabase-praxis.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
