import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next 16: middleware heter numera "proxy" (exporterar funktionen `proxy`).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Matcha alla paths utom:
     * - api (route handlers: webhooks/cron – behöver ingen session-refresh)
     * - _next/static (statiska filer)
     * - _next/image (bildoptimering)
     * - favicon.ico
     * - bildfiler i public/ (svg, png, jpg, ...)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
