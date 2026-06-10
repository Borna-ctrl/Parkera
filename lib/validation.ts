import { z } from "zod";

import { DISTRICTS } from "@/lib/constants";

export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Titeln måste vara minst 3 tecken")
    .max(80, "Titeln är för lång"),
  description: z
    .string()
    .trim()
    .min(10, "Beskriv platsen lite mer (minst 10 tecken)")
    .max(2000, "Beskrivningen är för lång"),
  parking_type: z.enum(["garage", "driveway", "outdoor"], {
    message: "Välj typ av plats",
  }),
  district: z
    .string()
    .refine((d) => (DISTRICTS as readonly string[]).includes(d), {
      message: "Välj en stadsdel",
    }),
  address: z.string().trim().max(120, "Adressen är för lång").optional(),
  price_per_day: z.coerce
    .number()
    .int("Priset måste vara ett heltal")
    .min(1, "Ange ett pris per dygn")
    .max(100000, "Priset är orimligt högt"),
  image_paths: z.array(z.string()).max(8, "Max 8 bilder").default([]),
  available_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt datum")
    .optional()
    .or(z.literal("")),
  available_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ogiltigt datum")
    .optional()
    .or(z.literal("")),
}).refine(
  (d) => !d.available_from || !d.available_to || d.available_to >= d.available_from,
  { message: "Slutdatum måste vara efter startdatum", path: ["available_to"] }
);

export type ListingInput = z.infer<typeof listingSchema>;

/** Rå input från formuläret innan zod-parsning (lösa typer). */
export type RawListingInput = {
  title: string;
  description: string;
  parking_type: string;
  district: string;
  address?: string;
  price_per_day: number;
  image_paths: string[];
  available_from?: string;
  available_to?: string;
};
