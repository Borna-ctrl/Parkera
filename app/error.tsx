"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Något gick fel</h1>
      <p className="text-muted-foreground">
        Ett oväntat fel uppstod. Försök igen, eller gå tillbaka till startsidan.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Försök igen</Button>
        <Button asChild variant="outline">
          <a href="/">Till startsidan</a>
        </Button>
      </div>
    </div>
  );
}
