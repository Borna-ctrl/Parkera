import { Suspense } from "react";
import { Search, MessageCircle, Clock, CreditCard } from "lucide-react";

import { HomepageMapWrapper } from "@/components/homepage-map-wrapper";
import { ListingFilters } from "@/components/listing-filters";
import { ListingGrid } from "@/components/listing-grid";
import type { ListingCardData } from "@/components/listing-card";
import { DISTRICT_COORDS, districtDistanceKm } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; min?: string; max?: string }>;
}) {
  const { district, min, max } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(
      "id, title, district, price_per_day, price_per_month, parking_type, latitude, longitude, listing_images(storage_path, sort_order)"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const minNum = Number(min);
  const maxNum = Number(max);
  if (min && !Number.isNaN(minNum)) query = query.gte("price_per_day", minNum);
  if (max && !Number.isNaN(maxNum)) query = query.lte("price_per_day", maxNum);

  const { data } = await query;
  const listings = (data ?? []) as ListingCardData[];

  // Stadsdel är ingen hård filtrering längre, utan en närhetssortering:
  // visa alla, men med den valda stadsdelen först, därefter näst närmast osv.
  const sortByDistrict = district && district in DISTRICT_COORDS;
  if (sortByDistrict) {
    listings.sort(
      (a, b) =>
        districtDistanceKm(district, a.district) -
        districtDistanceKm(district, b.district)
    );
  }

  const mapListings = listings
    .filter(
      (l): l is typeof l & { latitude: number; longitude: number } =>
        l.latitude != null && l.longitude != null
    )
    .map((l) => ({
      id: l.id,
      price_per_day: l.price_per_day,
      latitude: l.latitude,
      longitude: l.longitude,
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Hero */}
      <section className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 text-sm font-semibold text-accent-soft-foreground">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Nu i Göteborg · {listings.length} lediga platser
        </span>
        <h1 className="max-w-2xl text-balance text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
          Hitta parkering nära dig — eller hyr ut din lediga plats
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          Privata parkeringsplatser i Göteborg, bokade direkt av ägaren. Tryggt,
          försäkrat och betalt via Stripe.
        </p>
      </section>

      {/* Sökfält */}
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_44px_-28px_rgba(20,32,43,0.4)]">
        <Suspense>
          <ListingFilters />
        </Suspense>
      </div>

      {/* Karta */}
      {mapListings.length > 0 && (
        <HomepageMapWrapper listings={mapListings} />
      )}

      {/* Så funkar det */}
      <section className="my-12">
        <h2 className="mb-8 text-2xl font-bold tracking-tight">Så funkar det</h2>
        <div className="relative flex flex-col gap-8 md:flex-row md:gap-0">
          {[
            { icon: Search,        title: "Hitta en plats",   desc: "Bläddra bland privata parkeringsplatser i Göteborg." },
            { icon: MessageCircle, title: "Skicka förfrågan", desc: "Välj dagar och skicka en bokningsförfrågan till ägaren." },
            { icon: Clock,         title: "Vänta på svar",    desc: "Uthyraren accepterar eller avböjer — du får besked direkt." },
            { icon: CreditCard,    title: "Betala & parkera", desc: "Betala säkert via Stripe och få den exakta adressen." },
          ].map(({ icon: Icon, title, desc }, i, arr) => (
            <div key={title} className="relative flex flex-1 flex-col items-center text-center">
              {/* Streckad connector (ej efter sista) */}
              {i < arr.length - 1 && (
                <div className="absolute left-1/2 top-5 hidden h-px w-full border-t-2 border-dashed border-border md:block" />
              )}
              {/* Vertikal connector på mobil */}
              {i < arr.length - 1 && (
                <div className="absolute left-5 top-10 h-full w-px border-l-2 border-dashed border-border md:hidden" />
              )}
              <span className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${
                i === arr.length - 1
                  ? "bg-accent text-accent-foreground"
                  : "bg-primary text-primary-foreground"
              }`}>
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-base font-bold">{title}</p>
              <p className="mt-1 max-w-[160px] text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lediga platser */}
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Lediga platser i Göteborg
          </h2>
          <span className="text-sm font-semibold text-primary">
            Visa alla {listings.length} →
          </span>
        </div>

        {sortByDistrict && (
          <p className="mb-4 text-sm text-muted-foreground">
            Visar platser närmast{" "}
            <span className="font-medium">{district}</span> först.
          </p>
        )}

        <ListingGrid listings={listings} />
      </section>
    </div>
  );
}
