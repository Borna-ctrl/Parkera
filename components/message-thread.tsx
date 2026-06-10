"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { useMessages, type ChatMessage } from "@/lib/chat/use-messages";
import { Avatar } from "@/components/avatar";
import { MessageInput } from "@/components/message-input";

type Participant = { name: string; avatarPath: string | null };

const timeFmt = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
});

export function MessageThread({
  conversationId,
  currentUserId,
  initialMessages,
  participants,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  participants: Record<string, Participant>;
}) {
  const messages = useMessages(conversationId, initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-[60vh] flex-col rounded-lg border border-border bg-card">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Inga meddelanden än. Säg hej!
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            const sender = participants[m.sender_id];
            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-end gap-2",
                  mine ? "justify-end" : "justify-start"
                )}
              >
                {!mine && (
                  <Avatar
                    name={sender?.name}
                    path={sender?.avatarPath}
                    size={28}
                  />
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-right text-[10px]",
                      mine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {timeFmt.format(new Date(m.created_at))}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        <MessageInput conversationId={conversationId} />
      </div>
    </div>
  );
}
