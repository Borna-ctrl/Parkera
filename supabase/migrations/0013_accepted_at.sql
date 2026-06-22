-- v1.9: spårning av när en bokning accepterades.
-- Används för att tvinga betalning inom 1 timme (lazy + cron-kontroll).

alter table public.bookings
  add column accepted_at timestamptz;
