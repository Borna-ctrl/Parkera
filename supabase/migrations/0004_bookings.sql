-- Fas 3: bokningar + RLS + hjälpfunktion för spärrade datum.

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

-- Läsning: hyresgästen eller ägaren av annonsen.
create policy "Bokning syns för hyresgäst och ägare"
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

-- Skapa: inloggad hyresgäst, för sig själv, på aktiv annons som inte är ens egen.
create policy "Hyresgäst kan skapa bokning"
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

-- Uppdatering av status: ägaren (accept/neka) eller hyresgästen (avboka).
-- Vilken övergång som är tillåten avgörs i serverfunktionen transitionBooking().
create policy "Ägare och hyresgäst kan uppdatera bokning"
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

-- Spärrade datum (accepterade bokningar) – endast datumintervall, ingen hyresgästidentitet.
-- SECURITY DEFINER så en presumtiv hyresgäst kan se upptagna datum utan att läsa andras rader.
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
