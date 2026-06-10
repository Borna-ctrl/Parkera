"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listingSchema, type RawListingInput } from "@/lib/validation";

export type ListingActionState = { error?: string; id?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createListing(
  input: RawListingInput
): Promise<ListingActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Du måste vara inloggad." };

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { image_paths, address, available_from, available_to, ...fields } =
    parsed.data;

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      ...fields,
      address: address || null,
      available_from: available_from || null,
      available_to: available_to || null,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error || !listing) {
    return { error: "Kunde inte skapa annonsen. Försök igen." };
  }

  if (image_paths.length > 0) {
    await supabase.from("listing_images").insert(
      image_paths.map((storage_path, i) => ({
        listing_id: listing.id,
        storage_path,
        sort_order: i,
      }))
    );
  }

  revalidatePath("/");
  return { id: listing.id };
}

export async function updateListing(
  id: string,
  input: RawListingInput
): Promise<ListingActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Du måste vara inloggad." };

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { image_paths, address, available_from, available_to, ...fields } =
    parsed.data;

  const { error } = await supabase
    .from("listings")
    .update({
      ...fields,
      address: address || null,
      available_from: available_from || null,
      available_to: available_to || null,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    return { error: "Kunde inte uppdatera annonsen." };
  }

  // Synka bilder: ersätt raderna med den nya uppsättningen.
  await supabase.from("listing_images").delete().eq("listing_id", id);
  if (image_paths.length > 0) {
    await supabase.from("listing_images").insert(
      image_paths.map((storage_path, i) => ({
        listing_id: id,
        storage_path,
        sort_order: i,
      }))
    );
  }

  revalidatePath("/");
  revalidatePath(`/listings/${id}`);
  return { id };
}

export async function removeListing(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  if (!user) return;

  await supabase
    .from("listings")
    .update({ status: "removed" })
    .eq("id", id)
    .eq("owner_id", user.id);

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
