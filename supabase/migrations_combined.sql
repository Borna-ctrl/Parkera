-- ===== 0001_profiles.sql =====
-- Fas 1: profiles + auto-trigger + RLS
-- En profilrad per anvÃ¤ndare, kopplad 1:1 till auth.users.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiler Ã¤r publikt lÃ¤sbara (Ã¤garnamn visas pÃ¥ annonser och i chatt).
create policy "Profiler Ã¤r lÃ¤sbara fÃ¶r alla"
  on public.profiles
  for select
  using (true);

-- AnvÃ¤ndare fÃ¥r bara uppdatera sin egen profil.
create policy "AnvÃ¤ndare kan uppdatera sin egen profil"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Skapa profilrad automatiskt nÃ¤r en ny auth.users-rad skapas.
-- SECURITY DEFINER sÃ¥ insert sker oavsett RLS; tom search_path enligt Supabase-praxis.
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


-- ===== 0002_listings.sql =====
-- Fas 2: listings + listing_images + RLS

create type public.parking_type as enum ('garage', 'driveway', 'outdoor');
create type public.listing_status as enum ('active', 'removed');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  parking_type public.parking_type not null,
  district text not null,
  address text,
  price_per_day integer not null check (price_per_day >= 0),
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_district_idx on public.listings (district);
create index listings_status_idx on public.listings (status);
create index listings_owner_idx on public.listings (owner_id);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index listing_images_listing_idx on public.listing_images (listing_id);

alter table public.listings enable row level security;
alter table public.listing_images enable row level security;

-- Aktiva annonser Ã¤r publika; Ã¤garen ser Ã¤ven sina egna (oavsett status).
create policy "Aktiva annonser Ã¤r publika"
  on public.listings
  for select
  using (status = 'active' or auth.uid() = owner_id);

create policy "Ã„gare kan skapa annonser"
  on public.listings
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Ã„gare kan uppdatera sina annonser"
  on public.listings
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Borttagning sker som soft delete (status = 'removed'), inte fysisk DELETE.

-- Bilder syns om man fÃ¥r se annonsen; hanteras av Ã¤garen.
create policy "Bilder fÃ¶ljer annonsens synlighet"
  on public.listing_images
  for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'active' or l.owner_id = auth.uid())
    )
  );

create policy "Ã„gare kan lÃ¤gga till bilder"
  on public.listing_images
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid()
    )
  );

create policy "Ã„gare kan ta bort bilder"
  on public.listing_images
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid()
    )
  );

-- HÃ¥ll updated_at aktuell vid uppdatering.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_set_updated_at
  before update on public.listings
  for each row
  execute procedure public.set_updated_at();


-- ===== 0003_storage.sql =====
-- Fas 2: publik Storage-bucket fÃ¶r annonsbilder + policies.
-- SÃ¶kvÃ¤g-konvention: "<user_id>/<uuid>.<ext>" (Ã¤garen = fÃ¶rsta mappnivÃ¥n).

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Publik lÃ¤sning (annonsbilder Ã¤r Ã¤ndÃ¥ offentliga).
create policy "Publik lÃ¤sning av annonsbilder"
  on storage.objects
  for select
  using (bucket_id = 'listing-images');

-- Inloggade kan ladda upp i sin egen mapp.
create policy "Inloggade kan ladda upp annonsbilder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Ã„garen kan ta bort sina egna bilder.
create policy "Ã„gare kan ta bort sina annonsbilder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ===== 0004_bookings.sql =====
-- Fas 3: bokningar + RLS + hjÃ¤lpfunktion fÃ¶r spÃ¤rrade datum.

create type public.booking_status as enum (
  'pending',
  'accepted',
  'declined',
  'cancelled'
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  renter_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  constraint bookings_dates_check check (end_date >= start_date)
);

create index bookings_listing_idx on public.bookings (listing_id);
create index bookings_renter_idx on public.bookings (renter_id);
create index bookings_status_idx on public.bookings (status);

alter table public.bookings enable row level security;

-- LÃ¤sning: hyresgÃ¤sten eller Ã¤garen av annonsen.
create policy "Bokning syns fÃ¶r hyresgÃ¤st och Ã¤gare"
  on public.bookings
  for select
  to authenticated
  using (
    renter_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid()
    )
  );

-- Skapa: inloggad hyresgÃ¤st, fÃ¶r sig sjÃ¤lv, pÃ¥ aktiv annons som inte Ã¤r ens egen.
create policy "HyresgÃ¤st kan skapa bokning"
  on public.bookings
  for insert
  to authenticated
  with check (
    renter_id = auth.uid()
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.status = 'active'
        and l.owner_id <> auth.uid()
    )
  );

-- Uppdatering av status: Ã¤garen (accept/neka) eller hyresgÃ¤sten (avboka).
-- Vilken Ã¶vergÃ¥ng som Ã¤r tillÃ¥ten avgÃ¶rs i serverfunktionen transitionBooking().
create policy "Ã„gare och hyresgÃ¤st kan uppdatera bokning"
  on public.bookings
  for update
  to authenticated
  using (
    renter_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid()
    )
  )
  with check (
    renter_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid()
    )
  );

-- SpÃ¤rrade datum (accepterade bokningar) â€“ endast datumintervall, ingen hyresgÃ¤stidentitet.
-- SECURITY DEFINER sÃ¥ en presumtiv hyresgÃ¤st kan se upptagna datum utan att lÃ¤sa andras rader.
create or replace function public.listing_blocked_ranges(p_listing uuid)
returns table (start_date date, end_date date)
language sql
security definer
set search_path = ''
as $$
  select b.start_date, b.end_date
  from public.bookings b
  where b.listing_id = p_listing
    and b.status = 'accepted';
$$;

grant execute on function public.listing_blocked_ranges(uuid) to anon, authenticated;


-- ===== 0005_chat.sql =====
-- Fas 4: chatt â€“ conversations + messages + RLS + Realtime.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  renter_id uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, renter_id)
);

create index conversations_owner_idx on public.conversations (owner_id);
create index conversations_renter_idx on public.conversations (renter_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Konversationer syns och hanteras av sina deltagare.
create policy "Deltagare ser konversationer"
  on public.conversations
  for select
  to authenticated
  using (owner_id = auth.uid() or renter_id = auth.uid());

create policy "HyresgÃ¤st kan skapa konversation"
  on public.conversations
  for insert
  to authenticated
  with check (renter_id = auth.uid());

-- Meddelanden syns fÃ¶r deltagarna i konversationen.
create policy "Deltagare ser meddelanden"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = auth.uid() or c.renter_id = auth.uid())
    )
  );

create policy "Deltagare kan skicka meddelanden"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.owner_id = auth.uid() or c.renter_id = auth.uid())
    )
  );

-- Uppdatera senaste-aktivitet pÃ¥ konversationen vid nytt meddelande.
create or replace function public.bump_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_bump_conversation
  after insert on public.messages
  for each row
  execute procedure public.bump_conversation();

-- Aktivera Realtime pÃ¥ messages (live-chatt).
alter publication supabase_realtime add table public.messages;


