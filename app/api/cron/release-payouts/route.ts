import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Betalar ut (Transfer) till ägaren ~24h efter att uthyrningen börjat.
// Skyddas av CRON_SECRET (Vercel Cron skickar den som Bearer-token).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    new URL(request.url).searchParams.get("key");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: due } = await admin
    .from("bookings")
    .select(
      "id, amount_total, stripe_charge_id, listing:listings!inner(owner:profiles!listings_owner_id_fkey(stripe_account_id))"
    )
    .eq("status", "accepted")
    .eq("payment_status", "captured")
    .lte("start_date", cutoff);

  let released = 0;
  for (const b of due ?? []) {
    const listing = Array.isArray(b.listing) ? b.listing[0] : b.listing;
    const owner = listing
      ? Array.isArray(listing.owner)
        ? listing.owner[0]
        : listing.owner
      : null;
    const account = owner?.stripe_account_id as string | undefined;

    // Uthyrare som ännu inte kopplat Stripe hoppas över – bokningen förblir
    // 'captured' och plockas upp automatiskt vid en senare körning när de kopplat.
    if (!account || !b.stripe_charge_id || !b.amount_total) continue;

    try {
      const transfer = await stripe.transfers.create({
        amount: b.amount_total,
        currency: "sek",
        destination: account,
        source_transaction: b.stripe_charge_id,
      });
      await admin
        .from("bookings")
        .update({ payment_status: "paid_out", stripe_transfer_id: transfer.id })
        .eq("id", b.id);
      released++;
    } catch {
      // Hoppa över – försöker igen vid nästa körning.
    }
  }

  return NextResponse.json({ released });
}
