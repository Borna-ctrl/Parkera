-- Fas v1.7: berika profil vid OAuth-inloggning (Google).
-- Google skickar namn/bild i raw_user_meta_data ('full_name'/'name', 'avatar_url'/'picture').
-- Uppdaterar handle_new_user så profilraden fylls även för OAuth-användare.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  return new;
end;
$$;
