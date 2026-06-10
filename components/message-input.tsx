"use client";

import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";

import { sendMessage } from "@/lib/chat/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MessageInput({ conversationId }: { conversationId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = inputRef.current?.value.trim() ?? "";
    if (!value) return;

    setError(null);
    setPending(true);
    const result = await sendMessage(conversationId, value);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          name="body"
          placeholder="Skriv ett meddelande…"
          autoComplete="off"
          maxLength={2000}
          disabled={pending}
        />
        <Button type="submit" size="icon" disabled={pending} aria-label="Skicka">
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
