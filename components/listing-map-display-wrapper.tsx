"use client";

import dynamic from "next/dynamic";

const ListingMapDisplay = dynamic(
  () => import("@/components/listing-map-display").then((m) => m.ListingMapDisplay),
  { ssr: false }
);

export function ListingMapDisplayWrapper({ lat, lng }: { lat: number; lng: number }) {
  return <ListingMapDisplay lat={lat} lng={lng} />;
}
