import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getProfile, updateProfile } from "@/lib/storageClient";

export async function POST(req: NextRequest) {
  try {
    const profile = await getProfile();
    
    if (!profile.stripeSubscriptionId) {
      return NextResponse.json({ error: "Customer does not have an active subscription." }, { status: 400 });
    }

    const { reason } = await req.json().catch(() => ({ reason: "" }));

    const subscription = await stripe.subscriptions.update(
      profile.stripeSubscriptionId,
      { 
        cancel_at_period_end: true,
        metadata: { cancellation_reason: reason || 'not_specified' }
      }
    );

    const cancelAt = new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString();

    const updatedProfile = {
      ...profile,
      subscriptionCancelAt: cancelAt
    };
    await updateProfile(updatedProfile, true);

    return NextResponse.json({ 
      success: true, 
      cancelAt 
    });
  } catch (err: unknown) {
    console.error("Error cancelling stripe subscription:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
