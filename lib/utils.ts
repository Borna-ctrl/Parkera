import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Slå ihop Tailwind-klasser med korrekt konfliktlösning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
