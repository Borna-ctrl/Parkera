export const AVATARS_BUCKET = "avatars";

/** Publik URL för en profilbild i avatars-bucketen. */
export function avatarPublicUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AVATARS_BUCKET}/${storagePath}`;
}
