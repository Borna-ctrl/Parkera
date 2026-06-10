"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/**
 * Flytande chattknapp nere till höger (inloggade). Visar en röd prick när ett
 * nytt meddelande kommer via Realtime. RLS gör att man bara tar emot meddelanden
 * från sina egna konversationer.
 */
export function ChatBubble({ userId }: { userId: string }) {
  const pathname = usePathname();
  const onMessages = pathname?.startsWith("/messages") ?? false;
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (onMessages) setHasNew(false);
  }, [onMessages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("chat-bubble")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const incoming = payload.new as { sender_id: string };
          if (incoming.sender_id === userId) return;
          if (window.location.pathname.startsWith("/messages")) return;
          setHasNew(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Dölj på själva meddelandesidorna för att inte krocka med chatt-UI:t.
  if (onMessages) return null;

  return (
    <Link
      href="/messages"
      aria-label="Meddelanden"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="h-6 w-6" />
      {hasNew && (
        <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-destructive ring-2 ring-card" />
      )}
    </Link>
  );
}
