import Link from "next/link";
import { SquareParking } from "lucide-react";

import { ChatBubble } from "@/components/chat-bubble";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unread = 0;
  if (user) {
    const { data: convos } = await supabase
      .from("conversations")
      .select(
        "owner_id, renter_id, last_message_at, owner_last_read_at, renter_last_read_at"
      )
      .or(`owner_id.eq.${user.id},renter_id.eq.${user.id}`);
    unread = (convos ?? []).filter((c) => {
      const lastRead =
        c.owner_id === user.id ? c.owner_last_read_at : c.renter_last_read_at;
      return new Date(c.last_message_at) > new Date(lastRead);
    }).length;
  }

  return (
    <>
      <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <SquareParking className="h-6 w-6 text-primary" />
          <span>Parkera</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/messages" className="relative">
                  Meddelanden
                  {unread > 0 && (
                    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                      {unread}
                    </span>
                  )}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Mina sidor</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/listings/new">Hyr ut din plats</Link>
              </Button>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">
                  Logga ut
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Logga in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Skapa konto</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
      </header>
      {user && <ChatBubble userId={user.id} />}
    </>
  );
}
