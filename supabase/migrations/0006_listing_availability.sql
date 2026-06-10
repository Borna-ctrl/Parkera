-- Tillgänglighetsperiod för annonser.
-- Båda null = alltid tillgänglig (oförändrat beteende).

alter table public.listings
  add column available_from date,
  add column available_to date;

alter table public.listings
  add constraint listings_availability_check
  check (
    available_from is null
    or available_to is null
    or available_to >= available_from
  );
