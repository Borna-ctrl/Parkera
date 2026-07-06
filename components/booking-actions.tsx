"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  transitionBooking,
  startBookingPayment,
  type BookingAction,
} from "@/lib/bookings/actions";
import { Button } from "@/components/ui/button";

export type BookingActionsData = {
  id: string;
  status: string;
  paymentStatus?: string;
  acceptedAt?: string | null;
  removed?: boolean;
};

export function BookingActions({
  booking,
  perspective,
}: {
  booking: BookingActionsData;
  perspective: "owner" | "renter";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const awaitingPayment =
    booking.status === "accepted" &&
    (!booking.paymentStatus || booking.paymentStatus === "none");

  useEffect(() => {
    if (!booking.acceptedAt || !awaitingPayment) return;
    const deadline = new Date(booking.acceptedAt).getTime() + 60 * 60 * 1000;
    const tick = () => setTimeLeft(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking.acceptedAt, awaitingPayment]);

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

  if (booking.removed) return null;

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {booking.status === "pending" && perspective === "owner" && (
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

      {booking.status === "pending" && perspective === "renter" && (
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

      {awaitingPayment && perspective === "renter" && (
        <>
          {timeLeft !== null && timeLeft <= 0 ? (
            <p className="text-sm text-muted-foreground">
              Betalningstiden gick ut — bokningen avbokas automatiskt.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {timeLeft !== null && timeLeft > 0 && (
                <p className="text-sm font-medium text-destructive">
                  ⏱ {Math.floor(timeLeft / 60000)} min{" "}
                  {Math.floor((timeLeft % 60000) / 1000)} sek kvar att betala
                </p>
              )}
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
