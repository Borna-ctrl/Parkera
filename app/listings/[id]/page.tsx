import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";

import { Avatar } from "@/components/avatar";
import { BookingForm } from "@/components/booking-form";
import { ImageGallery } from "@/components/image-gallery";
import { ListingMapDisplayWrapper } from "@/components/listing-map-display-wrapper";
import { SendMessageButton } from "@/components/send-message-button";
import { Button } from "@/components/ui/button";
import { parkingTypeLabel } from "@/lib/constants";
import { parseISODate } from "@/lib/dates";
import { removeListing } from "@/lib/listings/actions";
import { createClient } from "@/lib/supabase/server";

const availabilityFmt = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function availabilityLabel(from?: string | null, to?: string | null): string {
  if (from && to)
    return `Tillgänglig ${availabilityFmt.format(parseISODate(from))} – ${availabilityFmt.format(parseISODate(to))}`;
  if (from) return `Tillgänglig från ${availabilityFmt.format(parseISODate(from))}`;
  if (to) return `Tillgänglig till ${availabilityFmt.format(parseISODate(to))}`;
  return "Tillgänglig nu";
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "*, listing_images(storage_path, sort_order), owner:profiles!listings_owner_id_fkey(full_name, avatar_url)"
    )
    .eq("id", id)
    .single();

  const isOwner = Boolean(user) && user!.id === listing?.owner_id;

  if (!listing || (listing.status === "removed" && !isOwner)) {
    notFound();
  }

  const images = [...(listing.listing_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.storage_path);
  const ownerName = listing.owner?.full_name?.trim() || "Uthyrare";

  let blocked: { start_date: string; end_date: string }[] = [];
  if (!isOwner && listing.status === "active") {
    const { data } = await supabase.rpc("listing_blocked_ranges", {
      p_listing: listing.id,
    });
    blocked = (data ?? []) as { start_date: string; end_date: string }[];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ImageGallery paths={images} />
          {listing.latitude != null && listing.longitude != null && (
            <ListingMapDisplayWrapper lat={listing.latitude} lng={listing.longitude} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{listing.title}</h1>
            <p className="mt-1 text-muted-foreground">
              {listing.district} · {parkingTypeLabel(listing.parking_type)}
            </p>
          </div>

          <div>
            <p className="text-2xl font-bold text-primary">
              {listing.price_per_day} kr
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / dygn
              </span>
            </p>
            {listing.price_per_week && (
              <p className="text-sm text-muted-foreground">
                {listing.price_per_week} kr / v (vid 7+ dagar)
              </p>
            )}
            {listing.price_per_month && (
              <p className="text-sm text-muted-foreground">
                {listing.price_per_month} kr / mån (vid 30+ dagar)
              </p>
            )}
          </div>

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {availabilityLabel(listing.available_from, listing.available_to)}
          </p>

          <p className="whitespace-pre-line text-foreground/90">
            {listing.description}
          </p>

          {listing.address && isOwner && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {listing.address}
            </p>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar
                name={ownerName}
                path={listing.owner?.avatar_url}
                size={40}
              />
              <div>
                <p className="text-xs text-muted-foreground">Uthyrs av</p>
                <p className="font-medium">{ownerName}</p>
              </div>
            </div>
            {!isOwner && user && (
              <SendMessageButton listingId={listing.id} />
            )}
          </div>

          {listing.status === "removed" && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Den här annonsen är borttagen och visas inte i sök.
            </p>
          )}

          {isOwner ? (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/listings/${listing.id}/edit`}>Redigera</Link>
              </Button>
              {listing.status === "active" && (
                <form action={removeListing.bind(null, listing.id)}>
                  <Button type="submit" variant="destructive">
                    Ta bort
                  </Button>
                </form>
              )}
            </div>
          ) : listing.status === "active" ? (
            user ? (
              <BookingForm
                listingId={listing.id}
                pricePerDay={listing.price_per_day}
                pricePerWeek={listing.price_per_week ?? undefined}
                pricePerMonth={listing.price_per_month ?? undefined}
                blocked={blocked}
                availableFrom={listing.available_from}
                availableTo={listing.available_to}
              />
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Logga in
                </Link>{" "}
                för att skicka en bokningsförfrågan.
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
