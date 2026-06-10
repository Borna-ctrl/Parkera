"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Ange ditt namn").max(80, "Namnet är för långt"),
  avatar_url: z.string().max(300).optional().or(z.literal("")),
});

export type ProfileState = { error?: string; success?: boolean };

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Du måste vara inloggad." };
  }

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    avatar_url: formData.get("avatar_url"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      avatar_url: parsed.data.avatar_url || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Kunde inte spara profilen. Försök igen." };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
