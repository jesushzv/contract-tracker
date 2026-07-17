import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getProfileByStripeCustomerId, updateProfile } from "@/lib/storageClient";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    if (process.env.NODE_ENV !== "production" && req.headers.get("x-e2e-bypass") === "true") {
      event = JSON.parse(body) as Stripe.Event;
    } else {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
      }
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${msg}`);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier as "starter" | "pro";
        const stripeCustomerId = session.customer as string;
        const stripeSubscriptionId = session.subscription as string;

        if (!userId || !tier) {
          console.error("Missing userId or tier in checkout session metadata");
          break;
        }

        // Fetch user profile and update subscription details
        const profile = await getProfileByStripeCustomerId(stripeCustomerId) || {
          id: userId,
          email: session.customer_details?.email || "",
          fullName: session.customer_details?.name || "",
          bankDetails: { clabe: "", bankName: "", beneficiaryName: "" },
        };

        const updatedProfile = {
          ...profile,
          id: userId,
          tier,
          stripeCustomerId,
          stripeSubscriptionId,
        };

        await updateProfile(updatedProfile, true);
        console.log(`Successfully completed checkout for user ${userId} to tier ${tier}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        
        let tier: "starter" | "pro" | "free" = "free";
        const priceId = subscription.items.data[0]?.price?.id;
        
        if (priceId === process.env.STRIPE_PRICE_STARTER) {
          tier = "starter";
        } else if (priceId === process.env.STRIPE_PRICE_PRO) {
          tier = "pro";
        }

        const status = subscription.status;
        const active = status === "active" || status === "trialing";
        const finalTier = active ? tier : "free";

        const cancelAt = subscription.cancel_at_period_end 
          ? new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString() 
          : undefined;

        const profile = await getProfileByStripeCustomerId(stripeCustomerId);
        if (profile) {
          const updatedProfile = {
            ...profile,
            tier: finalTier,
            stripeSubscriptionId: subscription.id,
            subscriptionCancelAt: cancelAt,
          };
          await updateProfile(updatedProfile, true);
          console.log(`Subscription updated for customer ${stripeCustomerId}: tier set to ${finalTier} (status: ${status}, cancel_at: ${cancelAt})`);
        } else {
          console.warn(`Customer profile not found for Stripe customer ID: ${stripeCustomerId}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;

        const profile = await getProfileByStripeCustomerId(stripeCustomerId);
        if (profile) {
          const updatedProfile = {
            ...profile,
            tier: "free" as const,
            stripeSubscriptionId: undefined,
            subscriptionCancelAt: undefined,
          };
          await updateProfile(updatedProfile, true);
          console.log(`Subscription deleted for customer ${stripeCustomerId}: tier reset to free`);
        } else {
          console.warn(`Customer profile not found for deleted subscription customer ID: ${stripeCustomerId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Error processing Stripe webhook:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
