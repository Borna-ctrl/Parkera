import { DISTRICTS } from "@/lib/constants";

// Ungefärliga koordinater (centroid) för Göteborgs stadsdelar.
// Används enbart för "Nära mig" – att hitta närmaste stadsdel utifrån
// webbläsarens platsåtkomst. Ingen extern karttjänst krävs.
export const DISTRICT_COORDS: Record<
  (typeof DISTRICTS)[number],
  { lat: number; lng: number }
> = {
  Centrum: { lat: 57.7065, lng: 11.97 },
  Linné: { lat: 57.696, lng: 11.952 },
  Majorna: { lat: 57.694, lng: 11.923 },
  Haga: { lat: 57.699, lng: 11.953 },
  Vasastan: { lat: 57.6985, lng: 11.962 },
  Johanneberg: { lat: 57.684, lng: 11.981 },
  Örgryte: { lat: 57.7, lng: 12.01 },
  Lundby: { lat: 57.718, lng: 11.93 },
  Hisingen: { lat: 57.73, lng: 11.91 },
  Frölunda: { lat: 57.652, lng: 11.912 },
  Mölndal: { lat: 57.656, lng: 12.014 },
  Partille: { lat: 57.739, lng: 12.106 },
};

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Avstånd i km mellan två koordinater (haversine). */
function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Avstånd i km mellan två stadsdelars centroider. Saknas någon i kartan
 * returneras Infinity (sorteras sist).
 */
export function districtDistanceKm(a: string, b: string): number {
  const ca = DISTRICT_COORDS[a as keyof typeof DISTRICT_COORDS];
  const cb = DISTRICT_COORDS[b as keyof typeof DISTRICT_COORDS];
  if (!ca || !cb) return Infinity;
  return distanceKm(ca.lat, ca.lng, cb.lat, cb.lng);
}

/** Returnerar den stadsdel vars centroid ligger närmast given position. */
export function nearestDistrict(lat: number, lng: number): string {
  let best = "";
  let bestDistance = Infinity;
  for (const [name, coords] of Object.entries(DISTRICT_COORDS)) {
    const d = distanceKm(lat, lng, coords.lat, coords.lng);
    if (d < bestDistance) {
      bestDistance = d;
      best = name;
    }
  }
  return best;
}
