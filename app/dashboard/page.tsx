import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import {
  BookingRequestCard,
  type BookingCardData,
} from "@/components/booking-request-card";
import { ConnectButton } from "@/components/connect-button";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { syncBookingPayment } from "@/lib/bookings/actions";

type Rel<T> = T | T[] | null;

function one<T>(rel: Rel<T>): T | undefined {
  if (!rel) return undefined;
  return Array.isArray(rel) ? rel[0] : rel;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, stripe_account_id, stripe_account_ready")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name?.trim();
  const payoutReady = Boolean(profile?.stripe_account_ready);
  const payoutStarted = Boolean(profile?.stripe_account_id);

  const { data: incoming } = await supabase
    .from("bookings")
    .select(
      "id, start_date, end_date, status, payment_status, amount_total, listing:listings!inner(id, title, price_per_day, owner_id, status), renter:profiles!bookings_renter_id_fkey(full_name)"
    )
    .eq("listing.owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: myListings } = await supabase
    .from("listings")
    .select(
      "id, title, district, price_per_day, parking_type, listing_images(storage_path, sort_order)"
    )
    .eq("owner_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Intjänat men ännu ej utbetalt (väntar på Stripe-koppling / cron-körning).
  const pendingPayoutKr = Math.round(
    (incoming ?? [])
      .filter((b) => b.payment_status === "captured")
      .reduce((sum, b) => sum + (b.amount_total ?? 0), 0) / 100
  );

  const { data: outgoing } = await supabase
    .from("bookings")
    .select(
      "id, start_date, end_date, status, payment_status, amount_total, stripe_checkout_session_id, listing:listings!inner(id, title, price_per_day, status)"
    )
    .eq("renter_id", user.id)
    .order("created_at", { ascending: false });

  // Skyddsnät: reconcila betalningar mot Stripe ifall en webhook missats.
  const reconciled = new Map<string, string>();
  for (const b of outgoing ?? []) {
    if (
      b.status === "accepted" &&
      b.payment_status === "none" &&
      b.stripe_checkout_session_id
    ) {
      reconciled.set(b.id, await syncBookingPayment(b.id));
    }
  }

  type ListingRel = {
    id: string;
    title: string;
    price_per_day: number;
    status: string;
  };

  const incomingCards: BookingCardData[] = (incoming ?? []).map((b) => {
    const l = one<ListingRel>(b.listing);
    const r = one<{ full_name: string | null }>(b.renter);
    return {
      id: b.id,
      start_date: b.start_date,
      end_date: b.end_date,
      status: b.status,
      paymentStatus: b.payment_status,
      amountTotal: b.amount_total,
      listingId: l?.id ?? "",
      listingTitle: l?.title ?? "Annons",
      listingStatus: l?.status,
      pricePerDay: l?.price_per_day ?? 0,
      counterpart: r?.full_name?.trim() || "Hyresgäst",
    };
  });

  const outgoingCards: BookingCardData[] = (outgoing ?? []).map((b) => {
    const l = one<ListingRel>(b.listing);
    return {
      id: b.id,
      start_date: b.start_date,
      end_date: b.end_date,
      status: b.status,
      paymentStatus: reconciled.get(b.id) ?? b.payment_status,
      amountTotal: b.amount_total,
      listingId: l?.id ?? "",
      listingTitle: l?.title ?? "Annons",
      listingStatus: l?.status,
      pricePerDay: l?.price_per_day ?? 0,
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">
        {name ? `Hej ${name}!` : "Mina sidor"}
      </h1>
      <p className="mt-1 text-muted-foreground">
        Hantera dina annonser, bokningar och din profil.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hyr ut en plats</CardTitle>
            <CardDescription>
              Lägg upp din lediga parkeringsplats och börja ta emot förfrågningar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/listings/new">Skapa annons</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Din profil</CardTitle>
            <CardDescription>
              {name
                ? "Uppdatera ditt namn och dina uppgifter."
                : "Lägg till ditt namn så andra vet vem de bokar av."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/profile">Redigera profil</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle>Utbetalningar</CardTitle>
            <CardDescription>
              {payoutReady
                ? "Ditt utbetalningskonto är kopplat – pengarna betalas ut automatiskt efter avslutad uthyrning."
                : pendingPayoutKr > 0
                  ? `Du har ${pendingPayoutKr} kr att få utbetalt. Koppla ditt konto för att ta emot pengarna.`
                  : "Du kan ta emot bokningar direkt. Koppla utbetalning när du vill – det behövs först när du har fått betalt för en uthyrning."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payoutReady ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <CheckCircle2 className="h-4 w-4" /> Klart
                {pendingPayoutKr > 0 && (
                  <span className="text-muted-foreground">
                    · {pendingPayoutKr} kr på väg
                  </span>
                )}
              </p>
            ) : (
              <ConnectButton
                label={
                  payoutStarted
                    ? "Slutför kopplingen"
                    : pendingPayoutKr > 0
                      ? "Koppla konto & få betalt"
                      : "Koppla utbetalning"
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Mina annonser</h2>
          <Button asChild size="sm" variant="outline">
            <Link href="/listings/new">Ny annons</Link>
          </Button>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Dina aktiva annonser som är synliga för andra.
        </p>
        <div className="mt-4">
          {(myListings ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Du har inga aktiva annonser än.{" "}
              <Link href="/listings/new" className="text-primary hover:underline">
                Skapa din första
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(myListings ?? []).map((l) => (
                <ListingCard key={l.id} listing={l as ListingCardData} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">
          Inkommande förfrågningar
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Förfrågningar på dina annonser.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {incomingCards.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Inga förfrågningar än.
            </p>
          ) : (
            incomingCards.map((b) => (
              <BookingRequestCard key={b.id} booking={b} perspective="owner" />
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Dina bokningar</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Platser du har skickat förfrågan om.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {outgoingCards.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Du har inte skickat någon bokningsförfrågan än.{" "}
              <Link href="/" className="text-primary hover:underline">
                Hitta en plats
              </Link>
              .
            </p>
          ) : (
            outgoingCards.map((b) => (
              <BookingRequestCard key={b.id} booking={b} perspective="renter" />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
