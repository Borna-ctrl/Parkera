-- Fas 2: publik Storage-bucket för annonsbilder + policies.
-- Sökväg-konvention: "<user_id>/<uuid>.<ext>" (ägaren = första mappnivån).

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Publik läsning (annonsbilder är ändå offentliga).
create policy "Publik läsning av annonsbilder"
  on storage.objects
  for select
  using (bucket_id = 'listing-images');

-- Inloggade kan ladda upp i sin egen mapp.
create policy "Inloggade kan ladda upp annonsbilder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Ägaren kan ta bort sina egna bilder.
create policy "Ägare kan ta bort sina annonsbilder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
