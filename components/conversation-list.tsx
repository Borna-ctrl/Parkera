import Link from "next/link";

import { Avatar } from "@/components/avatar";

export type ConversationListItem = {
  id: string;
  listingTitle: string;
  counterpart: string;
  counterpartAvatar: string | null;
  lastMessageAt: string;
};

const dateFmt = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function ConversationList({
  conversations,
}: {
  conversations: ConversationListItem[];
}) {
  if (conversations.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-12 text-center text-sm text-muted-foreground">
        Inga konversationer än. När du skickar eller tar emot en bokningsförfrågan
        startas en chatt här.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`/messages/${c.id}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted"
          >
            <Avatar name={c.counterpart} path={c.counterpartAvatar} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.listingTitle}</p>
              <p className="truncate text-sm text-muted-foreground">
                {c.counterpart}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {dateFmt.format(new Date(c.lastMessageAt))}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
