// Supabase-inbäddade relationer kan vara objekt eller array beroende på kardinalitet.
type Rel<T> = T | T[] | null;

/** Normalisera en till-en-relation till ett enskilt objekt (eller undefined). */
export function one<T>(rel: Rel<T>): T | undefined {
  if (!rel) return undefined;
  return Array.isArray(rel) ? rel[0] : rel;
}
