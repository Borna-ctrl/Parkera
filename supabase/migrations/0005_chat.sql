-- Fas 4: chatt – conversations + messages + RLS + Realtime.

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

create policy "Hyresgäst kan skapa konversation"
  on public.conversations
  for insert
  to authenticated
  with check (renter_id = auth.uid());

-- Meddelanden syns för deltagarna i konversationen.
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

-- Uppdatera senaste-aktivitet på konversationen vid nytt meddelande.
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

-- Aktivera Realtime på messages (live-chatt).
alter publication supabase_realtime add table public.messages;
