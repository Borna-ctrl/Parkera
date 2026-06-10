import { ListingCard, type ListingCardData } from "@/components/listing-card";

export function ListingGrid({ listings }: { listings: ListingCardData[] }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
        <p className="font-medium">Inga annonser matchar din sökning</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Prova en annan stadsdel eller bredda prisintervallet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
