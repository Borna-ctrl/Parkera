"use client";

import { useState } from "react";

import { startOnboarding } from "@/lib/payments/connect";
import { Button } from "@/components/ui/button";

export function ConnectButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setError(null);
    setPending(true);
    const res = await startOnboarding();
    if (res.error) {
      setError(res.error);
      setPending(false);
      return;
    }
    if (res.url) window.location.href = res.url;
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={go} disabled={pending}>
        {pending ? "Öppnar…" : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
