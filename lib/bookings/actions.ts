"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ensureConversation } from "@/lib/chat/actions";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type BookingActionState = {
  error?: string;
  success?: boolean;
  id?: string;
  url?: string;
};

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function dayCount(start: string, end: string): number {
  const ms =
    Date.parse(`${end}T00:00:00`) - Date.parse(`${start}T00:00:00`);
  return Math.round(ms / 86_400_000) + 1;
}

function relOne<T>(rel: T | T[] | null | undefined): T | undefined {
  if (!rel) return undefined;
  return Array.isArray(rel) ? rel[0] : rel;
}

export type BookingAction = "accept" | "decline" | "cancel";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt datum");

const bookingSchema = z
  .object({
    listingId: z.string().uuid("Ogiltig annons"),
    start: dateString,
    end: dateString,
  })
  .refine((d) => d.end >= d.start, {
    message: "Slutdatum måste vara samma dag eller efter startdatum",
  });

type BlockedRange = { start_date: string; end_date: string };

function overlaps(ranges: BlockedRange[], start: string, end: string): boolean {
  return ranges.some((r) => r.start_date <= end && r.end_date >= start);
}

export async function createBooking(
  listingId: string,
  start: string,
  end: string
): Promise<BookingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du måste vara inloggad för att boka." };

  const parsed = bookingSchema.safeParse({ listingId, start, end });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga datum." };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.start < today) {
    return { error: "Startdatum kan inte vara i dåtid." };
  }

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "owner_id, status, available_from, available_to, price_per_day, title, owner:profiles!listings_owner_id_fkey(stripe_account_ready)"
    )
    .eq("id", listingId)
    .single();

  if (!listing || listing.status !== "active") {
    return { error: "Annonsen är inte tillgänglig." };
  }
  if (listing.owner_id === user.id) {
    return { error: "Du kan inte boka din egen plats." };
  }
  const ownerReady = relOne<{ stripe_account_ready: boolean }>(
    listing.owner
  )?.stripe_account_ready;
  if (!ownerReady) {
    return { error: "Uthyraren kan inte ta emot bokningar än." };
  }
  if (
    (listing.available_from && start < listing.available_from) ||
    (listing.available_to && end > listing.available_to)
  ) {
    return { error: "Platsen är inte tillgänglig de valda datumen." };
  }

  const { data: blocked } = await supabase.rpc("listing_blocked_ranges", {
    p_listing: listingId,
  });
  if (overlaps((blocked ?? []) as BlockedRange[], start, end)) {
    return { error: "De valda datumen är redan bokade." };
  }

  const amountTotal = dayCount(start, end) * listing.price_per_day * 100; // öre

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      listing_id: listingId,
      renter_id: user.id,
      start_date: start,
      end_date: end,
      amount_total: amountTotal,
    })
    .select("id")
    .single();

  if (error || !booking) {
    return { error: "Kunde inte skapa bokningen. Försök igen." };
  }

  // Starta chatt och lägg in ett första meddelande med förfrågan.
  const conversationId = await ensureConversation(listingId);
  if (conversationId) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: `Hej! Jag har skickat en bokningsförfrågan för ${start} – ${end}.`,
    });
  }

  // Ingen betalning här: köparen betalar först efter att uthyraren accepterat.
  revalidatePath("/dashboard");
  revalidatePath("/messages");
  revalidatePath(`/listings/${listingId}`);
  return { success: true, id: booking.id };
}

/**
 * Enda vägen att ändra en boknings status (anti-omskrivnings-söm för framtida
 * Stripe). Här läggs `pay`/`paid` till i v1.5 utan att röra anropande kod.
 */
export async function transitionBooking(
  bookingId: string,
  action: BookingAction
): Promise<BookingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du måste vara inloggad." };

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, start_date, end_date, listing_id, renter_id, payment_status, listing:listings!inner(owner_id)"
    )
    .eq("id", bookingId)
    .single();

  if (!booking) return { error: "Bokningen hittades inte." };

  const listingRel = Array.isArray(booking.listing)
    ? booking.listing[0]
    : booking.listing;
  const isOwner = listingRel?.owner_id === user.id;
  const isRenter = booking.renter_id === user.id;
  const paid =
    booking.payment_status === "captured" ||
    booking.payment_status === "paid_out";

  let newStatus: "accepted" | "declined" | "cancelled";
  if (action === "accept" || action === "decline") {
    if (!isOwner) return { error: "Endast ägaren kan svara på förfrågan." };
    if (booking.status !== "pending") {
      return { error: "Bokningen är redan hanterad." };
    }
    newStatus = action === "accept" ? "accepted" : "declined";
  } else {
    // Avboka: hyresgästen, fram tills betalning skett.
    if (!isRenter) return { error: "Endast hyresgästen kan avboka." };
    if (booking.status !== "pending" && booking.status !== "accepted") {
      return { error: "Bokningen är redan hanterad." };
    }
    if (paid) {
      return {
        error:
          "Bokningen är betald och kan inte avbokas här. Kontakta uthyraren.",
      };
    }
    newStatus = "cancelled";
  }

  const admin = createAdminClient();

  if (newStatus === "accepted") {
    // Datumen spärras nu – kontrollera att de inte krockar med annan accepterad bokning.
    const { data: blocked } = await supabase.rpc("listing_blocked_ranges", {
      p_listing: booking.listing_id,
    });
    if (
      overlaps(
        (blocked ?? []) as BlockedRange[],
        booking.start_date,
        booking.end_date
      )
    ) {
      return { error: "Datumen krockar med en redan accepterad bokning." };
    }
  }

  const { error } = await admin
    .from("bookings")
    .update({ status: newStatus })
    .eq("id", bookingId);
  if (error) return { error: "Kunde inte uppdatera bokningen." };

  revalidatePath("/dashboard");
  revalidatePath(`/listings/${booking.listing_id}`);
  return { success: true };
}

/**
 * Startar betalningen för en redan accepterad bokning. Köparen betalar (direkt
 * debitering) via Stripe Checkout; webhooken sätter `payment_status='captured'`.
 */
export async function startBookingPayment(
  bookingId: string
): Promise<BookingActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du måste vara inloggad." };

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, payment_status, renter_id, listing_id, amount_total, listing:listings!inner(title, owner:profiles!listings_owner_id_fkey(stripe_account_ready))"
    )
    .eq("id", bookingId)
    .single();

  if (!booking) return { error: "Bokningen hittades inte." };
  if (booking.renter_id !== user.id) {
    return { error: "Endast hyresgästen kan betala bokningen." };
  }
  if (booking.status !== "accepted" || booking.payment_status !== "none") {
    return { error: "Bokningen kan inte betalas i sitt nuvarande läge." };
  }

  const listingRel = relOne<{
    title: string;
    owner: { stripe_account_ready: boolean } | { stripe_account_ready: boolean }[];
  }>(booking.listing);
  const ownerReady = relOne<{ stripe_account_ready: boolean }>(
    listingRel?.owner
  )?.stripe_account_ready;
  if (!ownerReady) {
    return { error: "Uthyraren kan inte ta emot betalningar just nu." };
  }

  const amountTotal = booking.amount_total as number | null;
  if (!amountTotal || amountTotal <= 0) {
    return { error: "Bokningens belopp saknas." };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_intent_data: { metadata: { booking_id: booking.id } },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "sek",
            unit_amount: amountTotal,
            product_data: { name: `Parkering – ${listingRel?.title ?? "plats"}` },
          },
        },
      ],
      metadata: { booking_id: booking.id },
      success_url: `${appUrl()}/dashboard?betalning=ok`,
      cancel_url: `${appUrl()}/dashboard?betalning=avbruten`,
    });
    return { url: session.url ?? undefined, id: booking.id };
  } catch {
    return { error: "Kunde inte starta betalningen. Försök igen." };
  }
}
