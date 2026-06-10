// Stadsdelar i Göteborg (MVP – curated lista för filter och annonsformulär).
export const DISTRICTS = [
  "Centrum",
  "Linné",
  "Majorna",
  "Haga",
  "Vasastan",
  "Johanneberg",
  "Örgryte",
  "Lundby",
  "Hisingen",
  "Frölunda",
  "Mölndal",
  "Partille",
] as const;

export type District = (typeof DISTRICTS)[number];

export const PARKING_TYPES = [
  { value: "garage", label: "Garage" },
  { value: "driveway", label: "Uppfart" },
  { value: "outdoor", label: "Utomhus" },
] as const;

export type ParkingType = (typeof PARKING_TYPES)[number]["value"];

export function parkingTypeLabel(value: string): string {
  return PARKING_TYPES.find((t) => t.value === value)?.label ?? value;
}
