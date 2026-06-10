import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Sidan hittades inte</h1>
      <p className="text-muted-foreground">
        Annonsen eller sidan du letar efter finns inte längre.
      </p>
      <Button asChild>
        <Link href="/">Till startsidan</Link>
      </Button>
    </div>
  );
}
