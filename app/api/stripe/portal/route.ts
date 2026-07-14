import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getProfile } from "@/lib/storageClient";

export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile();
    
    if (!profile.stripeCustomerId) {
      return NextResponse.json({ error: "Customer does not have a Stripe account yet." }, { status: 400 });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: unknown) {
    console.error("Error creating stripe portal session:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
