"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/**
 * Skapar (eller hämtar) konversationen mellan hyresgäst och ägare för en annons.
 * Anropas när en bokningsförfrågan skickas. Returnerar conversation-id.
 */
export async function ensureConversation(
  listingId: string
): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: listing } = await supabase
    .from("listings")
    .select("owner_id")
    .eq("id", listingId)
    .single();
  if (!listing || listing.owner_id === user.id) return null;

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("renter_id", user.id)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId,
      owner_id: listing.owner_id,
      renter_id: user.id,
    })
    .select("id")
    .single();

  return created?.id ?? null;
}

const messageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1, "Skriv ett meddelande").max(2000),
});

export type SendMessageState = { error?: string; success?: boolean };

export async function sendMessage(
  conversationId: string,
  body: string
): Promise<SendMessageState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Du måste vara inloggad." };

  const parsed = messageSchema.safeParse({ conversationId, body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltigt meddelande." };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: parsed.data.conversationId,
    sender_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { error: "Kunde inte skicka meddelandet." };

  // Avsändaren har "läst" sin egen konversation (notifieras inte om eget meddelande).
  await supabase.rpc("mark_conversation_read", {
    p_conversation: parsed.data.conversationId,
  });

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { success: true };
}
