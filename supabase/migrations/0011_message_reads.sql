-- v1.7: läs-spårning för meddelanden (oläst-notis).
-- Per deltagare: tidpunkt då de senast läste konversationen.

alter table public.conversations
  add column owner_last_read_at timestamptz not null default now(),
  add column renter_last_read_at timestamptz not null default now();

-- Markera konversationen som läst för den anropande användaren (owner el. renter).
-- security definer för att slippa en UPDATE-RLS-policy på conversations.
create or replace function public.mark_conversation_read(p_conversation uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set owner_last_read_at = now()
  where id = p_conversation and owner_id = auth.uid();

  update public.conversations
  set renter_last_read_at = now()
  where id = p_conversation and renter_id = auth.uid();
end;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;
