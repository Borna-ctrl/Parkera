import Stripe from "stripe";

// Server-side Stripe-singleton. Nyckeln läses från env (testläge lokalt).
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  typescript: true,
});
