-- v1.7: lagra Stripe Checkout-sessionens id på bokningen.
-- Möjliggör reconcile (självläkning) om checkout.session.completed-webhooken missas.

alter table public.bookings
  add column stripe_checkout_session_id text;

-- Utöka skyddet: även session-id får bara ändras av service_role (server).
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
      or new.stripe_checkout_session_id is distinct from old.stripe_checkout_session_id
      or new.amount_total is distinct from old.amount_total
    then
      raise exception 'Betalnings- och statusfält kan endast ändras av systemet';
    end if;
  end if;
  return new;
end;
$$;
