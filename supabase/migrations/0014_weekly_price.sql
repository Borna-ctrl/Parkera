alter table public.listings
  add column price_per_week integer check (price_per_week >= 0);
