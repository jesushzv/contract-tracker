import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

if (!stripeSecretKey && process.env.NODE_ENV === "production") {
  console.warn("WARNING: STRIPE_SECRET_KEY is not defined in production environment.");
}

export const stripe = new Stripe(stripeSecretKey, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2023-10-16" as any, // Cast as any to avoid type issues with library version updates
  typescript: true,
});
