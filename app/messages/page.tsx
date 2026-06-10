import { redirect } from "next/navigation";

import {
  ConversationList,
  type ConversationListItem,
} from "@/components/conversation-list";
import { one } from "@/lib/relations";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("conversations")
    .select(
      "id, owner_id, renter_id, last_message_at, listing:listings(title), owner:profiles!conversations_owner_id_fkey(full_name, avatar_url), renter:profiles!conversations_renter_id_fkey(full_name, avatar_url)"
    )
    .or(`owner_id.eq.${user.id},renter_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  const conversations: ConversationListItem[] = (data ?? []).map((c) => {
    const listing = one<{ title: string }>(c.listing);
    const owner = one<{ full_name: string | null; avatar_url: string | null }>(
      c.owner
    );
    const renter = one<{ full_name: string | null; avatar_url: string | null }>(
      c.renter
    );
    const isOwner = c.owner_id === user.id;
    const other = isOwner ? renter : owner;
    return {
      id: c.id,
      listingTitle: listing?.title ?? "Annons",
      counterpart: other?.full_name?.trim() || (isOwner ? "Hyresgäst" : "Uthyrare"),
      counterpartAvatar: other?.avatar_url ?? null,
      lastMessageAt: c.last_message_at,
    };
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Meddelanden</h1>
      <div className="mt-6">
        <ConversationList conversations={conversations} />
      </div>
    </div>
  );
}
