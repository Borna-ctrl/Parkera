import { notFound, redirect } from "next/navigation";

import { ListingForm, type ListingFormValues } from "@/components/listing-form";
import { createClient } from "@/lib/supabase/server";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("*, listing_images(storage_path, sort_order)")
    .eq("id", id)
    .single();

  if (!listing) {
    notFound();
  }

  if (listing.owner_id !== user.id) {
    redirect("/dashboard");
  }

  const initial: ListingFormValues = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    parking_type: listing.parking_type,
    district: listing.district,
    address: listing.address ?? "",
    price_per_day: listing.price_per_day,
    image_paths: [...(listing.listing_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => img.storage_path),
    available_from: listing.available_from ?? "",
    available_to: listing.available_to ?? "",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Redigera annons</h1>
      <div className="mt-6">
        <ListingForm userId={user.id} initial={initial} />
      </div>
    </div>
  );
}
