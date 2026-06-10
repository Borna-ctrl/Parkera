import { createClient } from "@supabase/supabase-js";

/**
 * Supabase-klient med service-role-nyckeln. Bypassar RLS och används endast på
 * servern för betalnings-/statusskrivningar (webhooks, cron, transitionBooking).
 * Får ALDRIG importeras i klientkomponenter.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
