"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import { sv } from "react-day-picker/locale";
import "react-day-picker/style.css";

import { createBooking } from "@/lib/bookings/actions";
import { toISODate, parseISODate } from "@/lib/dates";
import { Button } from "@/components/ui/button";

type BlockedRange = { start_date: string; end_date: string };

function dayCount(range: DateRange): number {
  if (!range.from || !range.to) return 0;
  const ms = range.to.getTime() - range.from.getTime();
  return Math.round(ms / 86_400_000) + 1; // inklusive båda dygnen
}

export function BookingForm({
  listingId,
  pricePerDay,
  pricePerMonth,
  blocked,
  availableFrom,
  availableTo,
}: {
  listingId: string;
  pricePerDay: number;
  pricePerMonth?: number;
  blocked: BlockedRange[];
  availableFrom?: string | null;
  availableTo?: string | null;
}) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tidigaste bokningsbara dag: idag, men aldrig före tillgänglighetsperiodens start.
  const fromDate = availableFrom ? parseISODate(availableFrom) : null;
  const earliest = fromDate && fromDate > today ? fromDate : today;

  const disabled = [
    { before: earliest },
    ...(availableTo ? [{ after: parseISODate(availableTo) }] : []),
    ...blocked.map((r) => ({
      from: parseISODate(r.start_date),
      to: parseISODate(r.end_date),
    })),
  ];

  const days = range ? dayCount(range) : 0;
  let total = 0;
  let priceLabel = "";
  if (days >= 31 && pricePerMonth) {
    const months = Math.floor(days / 30);
    total = months * pricePerMonth;
    priceLabel = `${months} mån × ${pricePerMonth} kr (månadspris)`;
  } else {
    total = days * pricePerDay;
    priceLabel = `${days} dygn × ${pricePerDay} kr`;
  }

  async function handleSubmit() {
    if (!range?.from || !range?.to) {
      setError("Välj ett start- och slutdatum.");
      return;
    }
    setError(null);
    setPending(true);

    const result = await createBooking(
      listingId,
      toISODate(range.from),
      toISODate(range.to)
    );

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setSuccess(true);
    setPending(false);
    setRange(undefined);
    router.refresh();
  }

  if (success) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="font-medium">Förfrågan skickad!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Uthyraren får svara på din förfrågan. Du ser status under{" "}
          <a href="/dashboard" className="text-primary hover:underline">
            Mina sidor
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-medium">Välj datum</p>
      <div
        className="mt-2"
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
          defaultMonth={fromDate ?? undefined}
          selected={range}
          onSelect={setRange}
          disabled={disabled}
          min={1}
        />
      </div>

      {days > 0 && (
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{priceLabel}</span>
          <span className="font-semibold">{total} kr</span>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={pending || !range?.from || !range?.to}
        className="mt-3 w-full"
      >
        {pending ? "Skickar…" : "Skicka bokningsförfrågan"}
      </Button>
    </div>
  );
}
