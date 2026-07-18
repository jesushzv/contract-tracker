import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";
import { getSupabaseClient } from "@/lib/storageSupabase";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // Reusing the password payload key to accept the Facturapi Live Secret Key for minimal frontend changes
    const { freelancerId, password: facturapiLiveKey } = data;
    
    if (!freelancerId || !facturapiLiveKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Encrypt the Live API Key before storing it
    const encryptedLiveKey = encrypt(facturapiLiveKey);
    
    const supabase = await getSupabaseClient(true);
    
    // Update the profile with the Facturapi key (we no longer need organization_id)
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        facturapi_live_key: encryptedLiveKey
      })
      .eq("id", freelancerId);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      return NextResponse.json({ error: "Failed to link Facturapi API Key to profile" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("CSD error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const freelancerId = searchParams.get("freelancerId");
    if (!freelancerId) {
      return NextResponse.json({ error: "Missing freelancerId" }, { status: 400 });
    }
    const supabase = await getSupabaseClient(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("facturapi_live_key")
      .eq("id", freelancerId)
      .single();
      
    if (error || !data?.facturapi_live_key) {
      return NextResponse.json({ hasCsd: false });
    }
    return NextResponse.json({ hasCsd: true, createdAt: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
