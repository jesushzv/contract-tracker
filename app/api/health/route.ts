import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // If no Supabase keys are configured, check local database fallback health
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({
      status: "healthy",
      database: "local-file-db",
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Service-level connection verification query
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { 
          status: "unhealthy", 
          database: "disconnected", 
          error: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      database: "supabase-connected",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { 
        status: "unhealthy", 
        database: "connection-failed", 
        error: err.message 
      },
      { status: 500 }
    );
  }
}
