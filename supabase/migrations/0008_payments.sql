-- v1.5: Stripe Connect-betalning.
-- Ägares Connect-konto på profiles; betalningsfält + skydd på bookings.

alter table public.profiles
  add column stripe_account_id text,
  add column stripe_account_ready boolean not null default false;

create type public.payment_status as enum (
  'none',
  'authorized',
  'captured',
  'paid_out',
  'refunded',
  'failed'
);

alter table public.bookings
  add column stripe_payment_intent_id text,
  add column stripe_charge_id text,
  add column stripe_transfer_id text,
  add column amount_total integer, -- i öre
  add column payment_status public.payment_status not null default 'none';

-- Skydd: endast service_role (server) får ändra status + betalningskolumner.
-- Hindrar manipulation via den publika anon-nyckeln.
create or replace function public.guard_booking_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if new.status is distinct from old.status
      or new.payment_status is distinct from old.payment_status
      or new.stripe_payment_intent_id is distinct from old.stripe_payment_intent_id
      or new.stripe_charge_id is distinct from old.stripe_charge_id
      or new.stripe_transfer_id is distinct from old.stripe_transfer_id
      or new.amount_total is distinct from old.amount_total
    then
      raise exception 'Betalnings- och statusfält kan endast ändras av systemet';
    end if;
  end if;
  return new;
end;
$$;

create trigger bookings_guard_payment
  before update on public.bookings
  for each row
  execute procedure public.guard_booking_payment();

-- Skydd: endast service_role får ändra profilers Stripe-fält.
create or replace function public.guard_profile_stripe()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if new.stripe_account_id is distinct from old.stripe_account_id
      or new.stripe_account_ready is distinct from old.stripe_account_ready
    then
      raise exception 'Stripe-fält kan endast ändras av systemet';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_stripe
  before update on public.profiles
  for each row
  execute procedure public.guard_profile_stripe();
