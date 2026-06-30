"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { ensureConversation } from "@/lib/chat/actions";
import { Button } from "@/components/ui/button";

export function SendMessageButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const conversationId = await ensureConversation(listingId);
    if (conversationId) {
      router.push(`/messages/${conversationId}`);
    } else {
      router.push("/messages");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={pending}
      className="gap-2"
    >
      <MessageCircle className="h-4 w-4" />
      {pending ? "Öppnar…" : "Skicka meddelande"}
    </Button>
  );
}
