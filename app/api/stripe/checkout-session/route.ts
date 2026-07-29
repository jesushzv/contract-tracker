import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getProfile, getProfileByStripeCustomerId, updateProfile } from "@/lib/storageClient";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { tier } = await req.json();
    if (tier !== "starter" && tier !== "pro") {
      return NextResponse.json({ error: "Invalid tier specified" }, { status: 400 });
    }

    const profile = await getProfile();
    const userId = profile.id;
    const email = profile.email;

    // Get the price ID from environment variables
    const priceId = tier === "starter" 
      ? process.env.STRIPE_PRICE_STARTER 
      : process.env.STRIPE_PRICE_PRO;

    if (!priceId) {
      return NextResponse.json({ error: `Stripe price ID for tier '${tier}' is not configured` }, { status: 500 });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/plans`,
      metadata: {
        userId,
        tier,
      },
      ...(profile.stripeCustomerId && !profile.stripeCustomerId.startsWith("cus_test")
        ? { customer: profile.stripeCustomerId } 
        : { customer_email: email }
      )
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Error creating stripe checkout session:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");
    
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id parameter" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.status !== 'complete') {
      return NextResponse.json({ error: "Checkout not completed" }, { status: 400 });
    }
    
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier as "starter" | "pro";

    if (!userId || !tier) {
      return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 });
    }

    // Sync profile immediately to prevent webhook race conditions
    const profile = await getProfileByStripeCustomerId(session.customer as string) || {
      id: userId,
      email: session.customer_details?.email || "",
      fullName: session.customer_details?.name || "",
      bankDetails: { clabe: "", bankName: "", beneficiaryName: "" },
    };

    const updatedProfile = {
      ...profile,
      id: userId,
      tier,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
    };

    await updateProfile(updatedProfile, true);

    return NextResponse.json({ success: true, tier });
  } catch (err: unknown) {
    console.error("Error retrieving checkout session:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

