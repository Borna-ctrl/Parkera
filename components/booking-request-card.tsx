"use client";

import Link from "next/link";

import { BookingActions } from "@/components/booking-actions";
import { BookingTimeline } from "@/components/booking-timeline";
import { getBookingTimeline } from "@/lib/bookings/timeline";

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
  acceptedAt?: string;
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
  const timelineSteps = getBookingTimeline({
    status: booking.status as "pending" | "accepted" | "declined" | "cancelled",
    paymentStatus: (booking.paymentStatus ?? "none") as
      | "none"
      | "authorized"
      | "captured"
      | "paid_out"
      | "refunded"
      | "failed",
    startDate: booking.start_date,
    endDate: booking.end_date,
    acceptedAt: booking.acceptedAt ?? null,
  });
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
          <BookingTimeline steps={timelineSteps} compact />
          {paymentLabel && (
            <span className="text-xs text-muted-foreground">{paymentLabel}</span>
          )}
        </div>
      </div>

      <BookingActions
        booking={{
          id: booking.id,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          acceptedAt: booking.acceptedAt,
          removed,
        }}
        perspective={perspective}
      />
    </div>
  );
}
