import { NextResponse } from "next/server";

// Stripe träffar denna om onboarding-länken hunnit löpa ut.
// Användaren får starta om från dashboarden.
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
