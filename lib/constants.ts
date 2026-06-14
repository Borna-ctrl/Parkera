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

export const PARKING_TYPES = [
  { value: "garage", label: "Garage" },
  { value: "driveway", label: "Uppfart" },
  { value: "outdoor", label: "Utomhus" },
] as const;

export function parkingTypeLabel(value: string): string {
  return PARKING_TYPES.find((t) => t.value === value)?.label ?? value;
}
