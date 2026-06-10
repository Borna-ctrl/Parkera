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

-- Aktiva annonser är publika; ägaren ser även sina egna (oavsett status).
create policy "Aktiva annonser är publika"
  on public.listings
  for select
  using (status = 'active' or auth.uid() = owner_id);

create policy "Ägare kan skapa annonser"
  on public.listings
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Ägare kan uppdatera sina annonser"
  on public.listings
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Borttagning sker som soft delete (status = 'removed'), inte fysisk DELETE.

-- Bilder syns om man får se annonsen; hanteras av ägaren.
create policy "Bilder följer annonsens synlighet"
  on public.listing_images
  for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'active' or l.owner_id = auth.uid())
    )
  );

create policy "Ägare kan lägga till bilder"
  on public.listing_images
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid()
    )
  );

create policy "Ägare kan ta bort bilder"
  on public.listing_images
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = auth.uid()
    )
  );

-- Håll updated_at aktuell vid uppdatering.
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
