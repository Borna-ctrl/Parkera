"use server";

import { revalidatePath } from "next/cache";

import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type ConnectState = { error?: string; url?: string };

/**
 * Skapar (vid behov) ett Stripe Express-konto för uthyraren och returnerar en
 * onboarding-länk. Stripe-fälten skrivs med service-role (skyddas av trigger).
 */
export async function startOnboarding(): Promise<ConnectState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du måste vara inloggad." };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  let accountId = profile?.stripe_account_id as string | null;

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "SE",
        email: user.email ?? undefined,
        business_type: "individual",
        capabilities: { transfers: { requested: true } },
      });
      accountId = account.id;
      await admin
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl()}/api/stripe/connect/refresh`,
      return_url: `${appUrl()}/api/stripe/connect/return`,
      type: "account_onboarding",
    });

    return { url: link.url };
  } catch (e) {
    console.error("startOnboarding misslyckades:", e);
    return { error: "Kunde inte starta Stripe-onboardingen. Försök igen." };
  }
}

/** Hämtar kontots status från Stripe och uppdaterar stripe_account_ready. */
export async function refreshConnectStatus(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  const accountId = profile?.stripe_account_id as string | null;
  if (!accountId) return;

  try {
    const account = await stripe.accounts.retrieve(accountId);
    const ready = Boolean(account.charges_enabled && account.payouts_enabled);
    await admin
      .from("profiles")
      .update({ stripe_account_ready: ready })
      .eq("id", user.id);
    revalidatePath("/dashboard");
  } catch {
    // Lämna status oförändrad vid tillfälligt fel.
  }
}
