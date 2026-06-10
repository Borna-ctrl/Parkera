import { NextResponse } from "next/server";

import { refreshConnectStatus } from "@/lib/payments/connect";

// Stripe skickar tillbaka uthyraren hit efter onboarding.
export async function GET(request: Request) {
  await refreshConnectStatus();
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
