# Parkera – Setup

Webbaserad marknadsplats för uthyrning av privata parkeringsplatser i Göteborg.

## Tech stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** (CSS-baserad config i `app/globals.css`)
- **Supabase** (EU/Frankfurt): Postgres + Auth + Storage + Realtime + RLS
- Deploy: **Vercel (EU)**

## Förutsättningar

- Node.js 20+ (testat med v22)
- Ett gratis Supabase-konto
- (För deploy) ett Vercel-konto

## 1. Skapa Supabase-projekt

1. Gå till [supabase.com](https://supabase.com) → **New project**.
2. **Region: EU Central (Frankfurt / eu-central-1)** – viktigt för GDPR.
3. Vänta tills projektet är klart.
4. Gå till **Project Settings → API** och kopiera:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Konfigurera miljövariabler

Kopiera exempelfilen och fyll i dina värden:

```bash
cp .env.local.example .env.local
```

Redigera `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<din-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<din-anon-key>
```

## 3. Installera och kör

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

> **Windows + Turbopack:** om `npm run dev` kraschar med en Turbopack-panic
> (`0xC0000142` när PostCSS-loadern startar), kör webpack-varianten istället:
> `npm run dev:webpack`. Produktion (`npm run build` + `npm run start`) påverkas inte.

## 4. Databasmigrationer

SQL-migrationer ligger i `supabase/migrations/` och körs i nummerordning i
**Supabase Dashboard → SQL Editor** (eller via Supabase CLI):

- `0001_profiles.sql` – profiltabell, auto-trigger på nya användare, RLS.
- `0002_listings.sql` – annonser + annonsbilder, RLS, updated_at-trigger.
- `0003_storage.sql` – publik bucket `listing-images` + storage-policies.
- `0004_bookings.sql` – bokningar, RLS, samt funktion för spärrade datum.
- `0005_chat.sql` – konversationer + meddelanden, RLS, samt Realtime på `messages`.
- `0006_listing_availability.sql` – tillgänglighetsperiod (från/till) på annonser.
- `0007_avatars.sql` – publik bucket `avatars` för profilbilder + policies.
- `0008_payments.sql` – Stripe Connect-fält + betalningskolumner + skydds-triggers.
- `0009_google_profile.sql` – fyller profilnamn/avatar även vid Google-inloggning.
- `0010_payment_session.sql` – lagrar Checkout-sessionens id för betalnings-reconcile.

**Testdata (valfritt):** `supabase/seed.sql` lägger in 8 exempelannonser. Kör det
efter migrationerna och efter att du registrerat minst ett konto (annonserna
kopplas till den först skapade användaren).

## 5. Auth-inställningar (Supabase Dashboard)

Under **Authentication → Sign In / Providers → Email**:

- Aktivera **Email** och **Confirm email** (e-postverifiering på).

Under **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` (lokalt) / din Vercel-URL i produktion.
- **Redirect URLs:** lägg till `http://localhost:3000/**` och
  `https://<din-vercel-domän>/**` så att bekräftelselänken får returnera till
  `/auth/callback`.

> Bekräftelsemailet skickar användaren till `/auth/callback`, som växlar koden mot
> en session och vidarebefordrar till `/dashboard`.

### Logga in med Google (valfritt men rekommenderat)

Knappen **"Fortsätt med Google"** finns redan i appen. Aktivera providern så här:

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)):
   - Skapa/öppna ett projekt → **APIs & Services → OAuth consent screen** → välj
     *External*, fyll i appnamn och support-mail, spara.
   - **APIs & Services → Credentials → Create credentials → OAuth client ID** →
     *Application type: Web application*.
   - Under **Authorized redirect URIs**, lägg till Supabases callback:
     `https://<projekt-ref>.supabase.co/auth/v1/callback`
     (`<projekt-ref>` är samma som i `NEXT_PUBLIC_SUPABASE_URL`).
   - Skapa → kopiera **Client ID** och **Client secret**.
2. **Supabase Dashboard → Authentication → Sign In / Providers → Google**: slå på,
   klistra in Client ID + Client secret, spara.
3. Säkerställ att **Redirect URLs** (samma ställe som ovan) innehåller
   `http://localhost:3000/**` och din prod-domän – krävs för retur till `/auth/callback`.

> Google sköter lösenord/identitet; ingen klienthemlighet hamnar i koden (den bor i
> Supabase). Namn och profilbild hämtas automatiskt från Google via
> `0009_google_profile.sql`.

## 6. Stripe (betalning, testläge)

Betalning sker via **Stripe Connect** (Airbnb-modell): kortet reserveras vid
bokningsförfrågan, dras när ägaren accepterar, och betalas ut till ägaren ~24h efter
att uthyrningen börjat. 0% plattformsavgift.

1. Skapa konto på [stripe.com](https://stripe.com) och **aktivera Connect**
   (Dashboard → Connect → kom igång; välj plattform/marknadsplats).
2. Hämta testnycklar (Developers → API keys) och lägg i `.env.local`:
   - `STRIPE_SECRET_KEY=sk_test_…`
   - `SUPABASE_SERVICE_ROLE_KEY=…` (Supabase → Project Settings → API, **hemlig**)
   - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
   - `CRON_SECRET=` valfri lång slumpsträng
3. Kör migrationen `0008_payments.sql`.
4. **Webhook lokalt** – installera Stripe CLI och kör:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Kopiera `whsec_…` som visas till `STRIPE_WEBHOOK_SECRET` i `.env.local`.
5. **Testflöde:**
   - Logga in → Dashboard → **Koppla Stripe** → slutför test-onboardingen.
   - Som annan användare: boka en plats → betala i Checkout med testkortet
     **`4242 4242 4242 4242`** (valfritt framtida datum, valfri CVC).
   - Ägaren accepterar → betalningen dras. Neka/avboka → reservationen släpps.
6. **Utbetalning (escrow):** körs av `/api/cron/release-payouts` (Vercel Cron, dagligen).
   Testa manuellt: `curl "http://localhost:3000/api/cron/release-payouts?key=DITT_CRON_SECRET"`
   (med en accepterad bokning vars `start_date` passerat).

### I produktion (Vercel)
- Lägg alla env-variabler ovan i Vercel (inkl. `CRON_SECRET` – Vercel Cron skickar den
  automatiskt som Bearer-token till routen).
- Skapa en webhook-endpoint i Stripe Dashboard mot
  `https://<din-domän>/api/stripe/webhook` (events: `checkout.session.completed`,
  `checkout.session.expired`, `account.updated`) och använd dess `whsec_…`.
- `vercel.json` schemalägger redan utbetalnings-jobbet dagligen.

## 7. Deploy till Vercel

1. Pusha repot till GitHub.
2. Importera i Vercel → välj **Region: EU**.
3. Lägg in `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY` under
   **Environment Variables**.
4. Deploy.

## Build

```bash
npm run build
```

Kör `npm run build` direkt (pipa inte utdata genom filter – det döljer fel/exitkoder).

## Projektstruktur

```
app/                  App Router – sidor & layouts
components/           Delade React-komponenter
components/ui/        Handrullade UI-primitiv (Button, Input, Label, Card)
lib/supabase/         Supabase-klienter (client/server) + session-helper
lib/utils.ts          cn()-helper för Tailwind-klasser
proxy.ts              Next 16-proxy (f.d. middleware) – uppdaterar auth-session
supabase/migrations/  SQL-migrationer
```
