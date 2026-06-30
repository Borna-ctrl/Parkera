"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import { sv } from "react-day-picker/locale";
import "react-day-picker/style.css";

import dynamic from "next/dynamic";

import { DISTRICTS, PARKING_TYPES } from "@/lib/constants";
import { toISODate, parseISODate } from "@/lib/dates";
import { createListing, updateListing } from "@/lib/listings/actions";
import { ImageUploader } from "@/components/image-uploader";
import { Button } from "@/components/ui/button";

const ListingMapEditor = dynamic(
  () => import("@/components/listing-map-editor").then((m) => m.ListingMapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 animate-pulse rounded-md border border-border bg-muted" />
    ),
  }
);
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type ListingFormValues = {
  id?: string;
  title: string;
  description: string;
  parking_type: string;
  district: string;
  address: string;
  price_per_day: number | "";
  price_per_week?: number | "";
  price_per_month?: number | "";
  image_paths: string[];
  available_from?: string;
  available_to?: string;
  latitude?: number;
  longitude?: number;
};

const availabilityFmt = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function ListingForm({
  userId,
  initial,
}: {
  userId: string;
  initial?: ListingFormValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [imagePaths, setImagePaths] = useState<string[]>(
    initial?.image_paths ?? []
  );
  const [availability, setAvailability] = useState<DateRange | undefined>(
    initial?.available_from
      ? {
          from: parseISODate(initial.available_from),
          to: initial.available_to
            ? parseISODate(initial.available_to)
            : undefined,
        }
      : undefined
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(
    initial?.latitude != null && initial?.longitude != null
      ? { lat: initial.latitude, lng: initial.longitude }
      : undefined
  );
  const [address, setAddress] = useState(initial?.address ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const rawWeek = formData.get("price_per_week");
    const rawMonth = formData.get("price_per_month");
    const input = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      parking_type: String(formData.get("parking_type") ?? ""),
      district: String(formData.get("district") ?? ""),
      address: String(formData.get("address") ?? ""),
      price_per_day: Number(formData.get("price_per_day") ?? 0),
      price_per_week: rawWeek ? Number(rawWeek) : undefined,
      price_per_month: rawMonth ? Number(rawMonth) : undefined,
      latitude: coords?.lat,
      longitude: coords?.lng,
      image_paths: imagePaths,
      available_from: availability?.from ? toISODate(availability.from) : "",
      available_to: availability?.to ? toISODate(availability.to) : "",
    };

    const result =
      isEdit && initial?.id
        ? await updateListing(initial.id, input)
        : await createListing(input);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.push(`/listings/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Rubrik</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={80}
          defaultValue={initial?.title}
          placeholder="T.ex. Garageplats i Linné, nära Linnéplatsen"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Beskrivning</Label>
        <Textarea
          id="description"
          name="description"
          required
          rows={5}
          defaultValue={initial?.description}
          placeholder="Beskriv platsen: storlek, tak/öppet, takhöjd, tillgänglighet, närhet till hållplats osv."
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="parking_type">Typ av plats</Label>
          <Select
            id="parking_type"
            name="parking_type"
            required
            defaultValue={initial?.parking_type ?? ""}
          >
            <option value="" disabled>
              Välj typ
            </option>
            {PARKING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="district">Stadsdel</Label>
          <Select
            id="district"
            name="district"
            required
            defaultValue={initial?.district ?? ""}
          >
            <option value="" disabled>
              Välj stadsdel
            </option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Adress (valfritt)</Label>
        <Input
          id="address"
          name="address"
          maxLength={120}
          defaultValue={initial?.address}
          placeholder="Visas bara för dig tills en bokning accepterats"
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Plats på karta (valfritt)</Label>
        <p className="text-sm text-muted-foreground">
          Visar en ungefärlig cirkel för hyresgästen — inte exakt adress.
        </p>
        <ListingMapEditor
          initialLat={initial?.latitude}
          initialLng={initial?.longitude}
          address={address}
          onChange={(lat, lng) => setCoords({ lat, lng })}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price_per_day">Dagspris (kr)</Label>
          <Input
            id="price_per_day"
            name="price_per_day"
            type="number"
            min={1}
            required
            inputMode="numeric"
            defaultValue={initial?.price_per_day || ""}
            placeholder="T.ex. 80"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price_per_week">Veckopris (kr, valfritt)</Label>
          <Input
            id="price_per_week"
            name="price_per_week"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={initial?.price_per_week || ""}
            placeholder="T.ex. 450"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price_per_month">Månadspris (kr, valfritt)</Label>
          <Input
            id="price_per_month"
            name="price_per_month"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={initial?.price_per_month || ""}
            placeholder="T.ex. 1 800"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Veckopris gäller vid 7+ dagar, månadspris vid 30+ dagar. Lämna tomt för att bara använda dagspriset.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label>Bilder</Label>
        <ImageUploader
          userId={userId}
          value={imagePaths}
          onChange={setImagePaths}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Tillgänglighet (valfritt)</Label>
        <p className="text-sm text-muted-foreground">
          Välj under vilka datum platsen kan bokas. Lämna tomt = alltid
          tillgänglig.
        </p>
        <div
          className="mt-1 self-start rounded-lg border border-border p-2"
          style={
            {
              "--rdp-accent-color": "#0d9488",
              "--rdp-accent-background-color": "#ccfbf1",
              "--rdp-day-width": "2.25rem",
              "--rdp-day-height": "2.25rem",
            } as React.CSSProperties
          }
        >
          <DayPicker
            mode="range"
            locale={sv}
            weekStartsOn={1}
            disabled={{ before: today }}
            selected={availability}
            onSelect={setAvailability}
          />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {availability?.from
              ? `Tillgänglig ${availabilityFmt.format(availability.from)}${
                  availability.to
                    ? ` – ${availabilityFmt.format(availability.to)}`
                    : ""
                }`
              : "Alltid tillgänglig"}
          </span>
          {availability?.from && (
            <button
              type="button"
              onClick={() => setAvailability(undefined)}
              className="font-medium text-primary hover:underline"
            >
              Rensa period
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Sparar…"
            : isEdit
              ? "Spara ändringar"
              : "Publicera annons"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={pending}
        >
          Avbryt
        </Button>
      </div>
    </form>
  );
}
