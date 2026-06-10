export const LISTING_IMAGES_BUCKET = "listing-images";

/** Publik URL för en bild i listing-images-bucketen. */
export function publicImageUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/${storagePath}`;
}
