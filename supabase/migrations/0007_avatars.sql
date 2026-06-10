-- Profilbilder: publik Storage-bucket för avatarer + policies.
-- Sökväg-konvention: "<user_id>/<uuid>.<ext>" (ägaren = första mappnivån).
-- (profiles.avatar_url finns redan sedan 0001 – ingen tabelländring behövs.)

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Publik läsning (profilbilder är offentliga).
create policy "Publik läsning av profilbilder"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

-- Inloggade kan ladda upp i sin egen mapp.
create policy "Inloggade kan ladda upp profilbild"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Användaren kan ta bort sina egna profilbilder.
create policy "Användare kan ta bort sin profilbild"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
