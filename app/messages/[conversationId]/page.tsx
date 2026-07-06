import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BookingActions } from "@/components/booking-actions";
import { BookingTimeline } from "@/components/booking-timeline";
import { MessageThread } from "@/components/message-thread";
import { getBookingTimeline } from "@/lib/bookings/timeline";
import { one } from "@/lib/relations";
import { createClient } from "@/lib/supabase/server";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      "id, listing_id, owner_id, renter_id, listing:listings(title), owner:profiles!conversations_owner_id_fkey(full_name, avatar_url), renter:profiles!conversations_renter_id_fkey(full_name, avatar_url)"
    )
    .eq("id", conversationId)
    .single();

  if (
    !conversation ||
    (conversation.owner_id !== user.id && conversation.renter_id !== user.id)
  ) {
    notFound();
  }

  // Markera konversationen som läst för den som öppnar den (nollar oläst-notisen).
  await supabase.rpc("mark_conversation_read", {
    p_conversation: conversationId,
  });

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  // En konversation kan i teorin höra ihop med flera bokningar över tid (samma
  // hyresgäst/uthyrare/annons, olika datum) — visa den senaste aktiva, annars senaste totalt.
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, payment_status, start_date, end_date, accepted_at, listing:listings(status)"
    )
    .eq("listing_id", conversation.listing_id)
    .eq("renter_id", conversation.renter_id)
    .order("created_at", { ascending: false });

  const relevantBooking =
    (bookings ?? []).find((b) => b.status === "pending" || b.status === "accepted") ??
    (bookings ?? [])[0] ??
    null;

  const timelineSteps = relevantBooking
    ? getBookingTimeline({
        status: relevantBooking.status as "pending" | "accepted" | "declined" | "cancelled",
        paymentStatus: relevantBooking.payment_status as
          | "none"
          | "authorized"
          | "captured"
          | "paid_out"
          | "refunded"
          | "failed",
        startDate: relevantBooking.start_date,
        endDate: relevantBooking.end_date,
        acceptedAt: relevantBooking.accepted_at,
      })
    : null;
  const relevantBookingListing = relevantBooking
    ? one<{ status: string }>(relevantBooking.listing)
    : null;

  const listing = one<{ title: string }>(conversation.listing);
  const owner = one<{ full_name: string | null; avatar_url: string | null }>(
    conversation.owner
  );
  const renter = one<{ full_name: string | null; avatar_url: string | null }>(
    conversation.renter
  );
  const isOwner = conversation.owner_id === user.id;
  const counterpart = isOwner
    ? renter?.full_name?.trim() || "Hyresgäst"
    : owner?.full_name?.trim() || "Uthyrare";

  const participants: Record<
    string,
    { name: string; avatarPath: string | null }
  > = {
    [conversation.owner_id]: {
      name: owner?.full_name?.trim() || "Uthyrare",
      avatarPath: owner?.avatar_url ?? null,
    },
    [conversation.renter_id]: {
      name: renter?.full_name?.trim() || "Hyresgäst",
      avatarPath: renter?.avatar_url ?? null,
    },
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/messages"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Tillbaka till meddelanden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <Link
            href={`/listings/${conversation.listing_id}`}
            className="font-semibold hover:underline"
          >
            {listing?.title ?? "Annons"}
          </Link>
          <p className="text-sm text-muted-foreground">{counterpart}</p>
        </div>
      </div>

      {timelineSteps && relevantBooking && (
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
          <BookingTimeline steps={timelineSteps} />
          <BookingActions
            booking={{
              id: relevantBooking.id,
              status: relevantBooking.status,
              paymentStatus: relevantBooking.payment_status,
              acceptedAt: relevantBooking.accepted_at,
              removed: relevantBookingListing?.status === "removed",
            }}
            perspective={isOwner ? "owner" : "renter"}
          />
        </div>
      )}

      <MessageThread
        conversationId={conversationId}
        currentUserId={user.id}
        initialMessages={messages ?? []}
        participants={participants}
      />
    </div>
  );
}
