import Link from "next/link";
import Image from "next/image";
import { SquareParking } from "lucide-react";

import { parkingTypeLabel } from "@/lib/constants";
import { publicImageUrl } from "@/lib/listings/images";

export type ListingCardData = {
  id: string;
  title: string;
  district: string;
  price_per_day: number;
  price_per_week?: number | null;
  price_per_month?: number | null;
  parking_type: string;
  listing_images: { storage_path: string; sort_order: number }[];
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const cover = [...listing.listing_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full bg-muted">
        {cover ? (
          <Image
            src={publicImageUrl(cover.storage_path)}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <SquareParking className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 p-4">
        <h3 className="truncate font-semibold">{listing.title}</h3>
        <p className="text-sm text-muted-foreground">
          {listing.district} · {parkingTypeLabel(listing.parking_type)}
        </p>
        <p className="mt-1 font-semibold text-primary">
          {listing.price_per_day} kr
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / dygn
          </span>
        </p>
        {listing.price_per_week && (
          <p className="text-xs text-muted-foreground">
            från {listing.price_per_week} kr / v
          </p>
        )}
        {listing.price_per_month && (
          <p className="text-xs text-muted-foreground">
            från {listing.price_per_month} kr / mån
          </p>
        )}
      </div>
    </Link>
  );
}
