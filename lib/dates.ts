/** Formatera ett Date till "YYYY-MM-DD" i lokal tid. */
export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Tolka "YYYY-MM-DD" som ett lokalt Date (midnatt). */
export function parseISODate(s: string): Date {
  return new Date(`${s}T00:00:00`);
}
