import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Saknar signatur" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Ogiltig signatur" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      if (bookingId && paymentIntentId) {
        let chargeId: string | null = null;
        try {
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
          chargeId =
            typeof pi.latest_charge === "string"
              ? pi.latest_charge
              : (pi.latest_charge?.id ?? null);
        } catch {
          // latest_charge kunde inte hämtas – behåll null.
        }
        // Betalningen är genomförd (direkt debitering). Idempotent: bara om obetald.
        await admin
          .from("bookings")
          .update({
            stripe_payment_intent_id: paymentIntentId,
            stripe_charge_id: chargeId,
            payment_status: "captured",
          })
          .eq("id", bookingId)
          .eq("payment_status", "none");
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const ready = Boolean(account.charges_enabled && account.payouts_enabled);
      await admin
        .from("profiles")
        .update({ stripe_account_ready: ready })
        .eq("stripe_account_id", account.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
