"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LocateFixed } from "lucide-react";

import { DISTRICTS } from "@/lib/constants";
import { nearestDistrict } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("district") ?? "");
  const [open, setOpen] = useState(false);
  const [geoPending, setGeoPending] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);

  const filtered = DISTRICTS.filter((d) =>
    d.toLowerCase().includes(query.trim().toLowerCase())
  );

  function resolveDistrict(): string {
    const q = query.trim().toLowerCase();
    if (!q) return "";
    return DISTRICTS.find((d) => d.toLowerCase() === q) ?? filtered[0] ?? "";
  }

  function pushWith(district: string) {
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    const min = minRef.current?.value ?? "";
    const max = maxRef.current?.value ?? "";
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpen(false);
    const district = resolveDistrict();
    setQuery(district);
    pushWith(district);
  }

  function handleReset() {
    setQuery("");
    setOpen(false);
    setGeoError(null);
    if (minRef.current) minRef.current.value = "";
    if (maxRef.current) maxRef.current.value = "";
    router.push("/");
  }

  function handleNearMe() {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Platsåtkomst stöds inte i din webbläsare.");
      return;
    }
    setGeoPending(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const district = nearestDistrict(
          pos.coords.latitude,
          pos.coords.longitude
        );
        setGeoPending(false);
        setQuery(district);
        setOpen(false);
        pushWith(district);
      },
      () => {
        setGeoPending(false);
        setGeoError(
          "Kunde inte hämta din plats. Tillåt platsåtkomst och försök igen."
        );
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="district">Stadsdel</Label>
        <div className="relative">
          <Input
            id="district"
            autoComplete="off"
            placeholder="Sök stadsdel…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
          />
          {open && filtered.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card py-1 shadow-md">
              {filtered.map((d) => (
                <li key={d}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setQuery(d);
                      setOpen(false);
                    }}
                    className="flex w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    {d}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {geoError && <p className="text-xs text-destructive">{geoError}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="min">Min kr/dygn</Label>
        <Input
          ref={minRef}
          id="min"
          name="min"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="0"
          defaultValue={searchParams.get("min") ?? ""}
          className="sm:w-28"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="max">Max kr/dygn</Label>
        <Input
          ref={maxRef}
          id="max"
          name="max"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="–"
          defaultValue={searchParams.get("max") ?? ""}
          className="sm:w-28"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleNearMe}
          disabled={geoPending}
        >
          {geoPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4" />
          )}
          Nära mig
        </Button>
        <Button type="submit">Sök</Button>
        <Button type="button" variant="ghost" onClick={handleReset}>
          Rensa
        </Button>
      </div>
    </form>
  );
}
