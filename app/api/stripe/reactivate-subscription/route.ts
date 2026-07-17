import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getProfile, updateProfile } from "@/lib/storageClient";

export async function POST() {
  try {
    const profile = await getProfile();
    
    if (!profile.stripeSubscriptionId) {
      return NextResponse.json({ error: "Customer does not have an active subscription." }, { status: 400 });
    }

    await stripe.subscriptions.update(
      profile.stripeSubscriptionId,
      { 
        cancel_at_period_end: false
      }
    );

    const updatedProfile = {
      ...profile,
      subscriptionCancelAt: undefined
    };
    await updateProfile(updatedProfile, true);

    return NextResponse.json({ 
      success: true 
    });
  } catch (err: unknown) {
    console.error("Error reactivating stripe subscription:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
