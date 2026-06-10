"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import { sv } from "react-day-picker/locale";
import "react-day-picker/style.css";

import { DISTRICTS, PARKING_TYPES } from "@/lib/constants";
import { toISODate, parseISODate } from "@/lib/dates";
import { createListing, updateListing } from "@/lib/listings/actions";
import { ImageUploader } from "@/components/image-uploader";
import { Button } from "@/components/ui/button";
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
  image_paths: string[];
  available_from?: string;
  available_to?: string;
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const input = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      parking_type: String(formData.get("parking_type") ?? ""),
      district: String(formData.get("district") ?? ""),
      address: String(formData.get("address") ?? ""),
      price_per_day: Number(formData.get("price_per_day") ?? 0),
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Adress (valfritt)</Label>
          <Input
            id="address"
            name="address"
            maxLength={120}
            defaultValue={initial?.address}
            placeholder="Visas bara för dig tills en bokning accepterats"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price_per_day">Pris per dygn (kr)</Label>
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
      </div>

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
