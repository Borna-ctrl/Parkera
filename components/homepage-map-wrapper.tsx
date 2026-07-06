"use client";

import dynamic from "next/dynamic";
import type { HomepageMapListing } from "@/components/homepage-map";

const HomepageMap = dynamic(
  () => import("@/components/homepage-map").then((m) => m.HomepageMap),
  { ssr: false }
);

export function HomepageMapWrapper({
  listings,
}: {
  listings: HomepageMapListing[];
}) {
  return <HomepageMap listings={listings} />;
}
