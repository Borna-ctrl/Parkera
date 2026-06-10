import { redirect } from "next/navigation";

import { ListingForm } from "@/components/listing-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Lägg upp en plats</h1>
      <p className="mt-1 text-muted-foreground">
        Fyll i uppgifterna nedan så blir din plats sökbar direkt.
      </p>
      <div className="mt-6">
        <ListingForm userId={user.id} />
      </div>
    </div>
  );
}
