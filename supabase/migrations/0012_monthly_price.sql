-- v1.8: valfritt månadspris på annonser.
-- Om satt används det automatiskt för bokningar på 31+ dagar.

alter table public.listings
  add column price_per_month integer check (price_per_month >= 0);
