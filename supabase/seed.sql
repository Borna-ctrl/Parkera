-- Seed: ~8 testannonser i Göteborg.
--
-- KÖR DETTA EFTER att du:
--   1. Kört migrationerna 0001–0005.
--   2. Registrerat (och e-postverifierat) minst ETT konto i appen.
--
-- Annonserna kopplas till den först skapade användaren. Kör i
-- Supabase Dashboard → SQL Editor. Annonserna saknar bilder (en
-- platshållarikon visas) – ladda upp bilder via "Redigera" i appen.

do $$
declare
  seed_owner uuid;
begin
  select id into seed_owner
  from auth.users
  order by created_at asc
  limit 1;

  if seed_owner is null then
    raise exception
      'Inga användare hittades. Registrera ett konto i appen först, kör sedan detta script.';
  end if;

  insert into public.listings
    (owner_id, title, description, parking_type, district, address, price_per_day)
  values
    (seed_owner,
     'Garageplats i Linné nära Linnéplatsen',
     E'Varm och torr garageplats i ett låst garage, ca 5 minuters promenad från Linnéplatsen. Perfekt för dig som vill slippa skrapa rutor på vintern. Takhöjd 2,1 m.',
     'garage', 'Linné', 'Linnégatan 40', 95),

    (seed_owner,
     'Uppfart i Majorna – nära spårvagnen',
     E'Egen uppfart på lugn gata i Majorna, 4 minuter till närmaste spårvagnshållplats. Plats för en normalstor bil. Tillgänglig dygnet runt.',
     'driveway', 'Majorna', 'Kustgatan 12', 70),

    (seed_owner,
     'Central p-plats i Vasastan',
     E'Markparkering mitt i Vasastan, gångavstånd till Avenyn och Vasaparken. Belyst och trygg innergård.',
     'outdoor', 'Vasastan', 'Vasagatan 25', 120),

    (seed_owner,
     'Varmgarage vid Chalmers (Johanneberg)',
     E'Plats i uppvärmt garage precis vid Chalmers. Idealiskt för studenter och anställda. Insläpp med tagg.',
     'garage', 'Johanneberg', 'Gibraltargatan 7', 85),

    (seed_owner,
     'P-plats på Hisingen nära Backaplan',
     E'Rymlig utomhusplats nära Backaplan och Hjalmar Brantingsplatsen. Enkel in- och utfart, passar även större bilar.',
     'outdoor', 'Hisingen', 'Backavägen 3', 55),

    (seed_owner,
     'Uppfart i lugnt villaområde, Örgryte',
     E'Asfalterad uppfart i villaområde i Örgryte. Trygg och lugn gata, nära Delsjön. Plats för en bil.',
     'driveway', 'Örgryte', 'Danska vägen 110', 65),

    (seed_owner,
     'Garageplats i Centrum vid Avenyn',
     E'Eftertraktad garageplats i centrala Göteborg, ett stenkast från Avenyn. Bevakat garage med kameraövervakning.',
     'garage', 'Centrum', 'Kungsportsavenyn 18', 135),

    (seed_owner,
     'Markplats nära Frölunda Torg',
     E'Prisvärd utomhusplats granne med Frölunda Torg och köpcentrumet. Bra för pendlare. Enkel parkering rakt in.',
     'outdoor', 'Frölunda', 'Frölunda Torg 2', 50);
end $$;
