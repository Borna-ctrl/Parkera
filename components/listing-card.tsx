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
  latitude?: number | null;
  longitude?: number | null;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const cover = [...listing.listing_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-video w-full bg-[#e7e1d4]">
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
        <span className="absolute right-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-foreground">
          {parkingTypeLabel(listing.parking_type)}
        </span>
      </div>

      <div className="flex flex-col gap-1 p-4">
        <h3 className="truncate font-bold">{listing.title}</h3>
        <p className="text-sm text-muted-foreground">{listing.district}</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-extrabold text-primary">
            {listing.price_per_day} kr
          </span>
          <span className="text-sm text-muted-foreground">/ dygn</span>
          {listing.price_per_week && (
            <span className="ml-auto text-xs text-muted-foreground">
              från {listing.price_per_week} kr/v
            </span>
          )}
        </div>
        {listing.price_per_month && !listing.price_per_week && (
          <p className="text-xs text-muted-foreground">
            från {listing.price_per_month} kr / mån
          </p>
        )}
      </div>
    </Link>
  );
}
