"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  transitionBooking,
  startBookingPayment,
  type BookingAction,
} from "@/lib/bookings/actions";
import { Button } from "@/components/ui/button";

export type BookingCardData = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  paymentStatus?: string;
  amountTotal?: number | null;
  listingId: string;
  listingTitle: string;
  listingStatus?: string;
  pricePerDay: number;
  counterpart?: string;
};

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Väntar på svar", className: "bg-accent text-accent-foreground" },
  accepted: { label: "Accepterad", className: "bg-primary/10 text-primary" },
  declined: { label: "Nekad", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Avbokad", className: "bg-muted text-muted-foreground" },
};

const PAYMENT: Record<string, string> = {
  authorized: "Reserverad",
  captured: "Betald",
  paid_out: "Utbetald",
  refunded: "Återbetald",
  failed: "Betalning misslyckades",
};

const dateFmt = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatRange(start: string, end: string): string {
  return `${dateFmt.format(new Date(`${start}T00:00:00`))} – ${dateFmt.format(
    new Date(`${end}T00:00:00`)
  )}`;
}

function nights(start: string, end: string): number {
  const ms =
    new Date(`${end}T00:00:00`).getTime() -
    new Date(`${start}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function BookingRequestCard({
  booking,
  perspective,
}: {
  booking: BookingCardData;
  perspective: "owner" | "renter";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = STATUS[booking.status] ?? {
    label: booking.status,
    className: "bg-muted text-muted-foreground",
  };
  const days = nights(booking.start_date, booking.end_date);
  const total =
    booking.amountTotal != null
      ? Math.round(booking.amountTotal / 100)
      : days * booking.pricePerDay;
  const removed = booking.listingStatus === "removed";
  const awaitingPayment =
    booking.status === "accepted" &&
    (!booking.paymentStatus || booking.paymentStatus === "none");
  const paymentLabel =
    booking.status === "accepted"
      ? awaitingPayment
        ? "Väntar på betalning"
        : (booking.paymentStatus && PAYMENT[booking.paymentStatus]) ?? null
      : null;

  async function act(action: BookingAction) {
    setError(null);
    setPending(true);
    const result = await transitionBooking(booking.id, action);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.refresh();
  }

  async function pay() {
    setError(null);
    setPending(true);
    const result = await startBookingPayment(booking.id);
    if (result.error || !result.url) {
      setError(result.error ?? "Kunde inte starta betalningen.");
      setPending(false);
      return;
    }
    window.location.href = result.url;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/listings/${booking.listingId}`}
            className="font-medium hover:underline"
          >
            {booking.listingTitle}
          </Link>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatRange(booking.start_date, booking.end_date)} · {days} dygn ·{" "}
            {total} kr
          </p>
          {perspective === "owner" && booking.counterpart && (
            <p className="text-sm text-muted-foreground">
              Förfrågan från {booking.counterpart}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {removed && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Borttagen annons
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
          {paymentLabel && (
            <span className="text-xs text-muted-foreground">{paymentLabel}</span>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {booking.status === "pending" && perspective === "owner" && !removed && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => act("accept")} disabled={pending}>
            Acceptera
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => act("decline")}
            disabled={pending}
          >
            Neka
          </Button>
        </div>
      )}

      {booking.status === "pending" && perspective === "renter" && !removed && (
        <div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => act("cancel")}
            disabled={pending}
          >
            Avboka förfrågan
          </Button>
        </div>
      )}

      {awaitingPayment && perspective === "renter" && !removed && (
        <div className="flex gap-2">
          <Button size="sm" onClick={pay} disabled={pending}>
            {pending ? "Öppnar…" : "Betala nu"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => act("cancel")}
            disabled={pending}
          >
            Avboka
          </Button>
        </div>
      )}
    </div>
  );
}
