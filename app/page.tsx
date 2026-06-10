import { Suspense } from "react";

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
      "id, title, district, price_per_day, parking_type, listing_images(storage_path, sort_order)"
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
          Nu i Göteborg
        </span>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Hitta parkering nära dig – eller hyr ut din lediga plats
        </h1>
        <p className="max-w-xl text-muted-foreground text-pretty">
          Privata parkeringsplatser i Göteborg, bokade direkt av ägaren.
        </p>
      </section>

      <Suspense>
        <ListingFilters />
      </Suspense>

      {sortByDistrict && (
        <p className="mt-6 text-sm text-muted-foreground">
          Visar platser närmast <span className="font-medium">{district}</span>{" "}
          först.
        </p>
      )}

      <div className={sortByDistrict ? "mt-4" : "mt-8"}>
        <ListingGrid listings={listings} />
      </div>
    </div>
  );
}
