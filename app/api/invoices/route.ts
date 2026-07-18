import { NextResponse } from "next/server";
import { generateInvoice } from "@/lib/facturapi";
import { getSupabaseClient } from "@/lib/storageSupabase";
import { decrypt } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { milestoneId, contractId, freelancerId } = data;
    
    if (!milestoneId || !contractId || !freelancerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const supabase = await getSupabaseClient(true);
    
    // Fetch freelancer's active CSD and profile to get Facturapi Live Key
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("facturapi_live_key")
      .eq("id", freelancerId)
      .single();

    if (profileError || !profile || !profile.facturapi_live_key) {
      // If they don't have CSD/Facturapi configured, we can't generate the invoice.
      await supabase.from("milestones").update({ cfdi_status: "pending_csd" }).eq("id", milestoneId);
      return NextResponse.json({ error: "No active CSD/Facturapi key found", code: "NO_CSD" }, { status: 400 });
    }

    // Fetch contract details to pass to Facturapi
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("client_name, client_rfc, client_regimen, client_postal, client_cfdi_use, sat_product_code, tax_regime_type, scope_description")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    
    // Decrypt Facturapi Live Key
    const facturapiLiveKey = decrypt(profile.facturapi_live_key);
    
    // Also fetch milestone for the specific amount and description
    const { data: milestone, error: milestoneError } = await supabase
      .from("milestones")
      .select("amount, label")
      .eq("id", milestoneId)
      .single();

    if (milestoneError || !milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    try {
      // Generate invoice
      const invoiceData = await generateInvoice({
        facturapiLiveKey,
        clientLegalName: contract.client_name,
        clientRfc: contract.client_rfc || "XAXX010101000",
        clientTaxSystem: contract.client_regimen || "616", // Default to Sin obligaciones fiscales
        clientZip: contract.client_postal || "00000",
        clientCfdiUse: contract.client_cfdi_use || "G03",
        satProductCode: contract.sat_product_code || "81111509", // Default if not configured
        taxRegimeType: contract.tax_regime_type || "general",
        description: `${contract.scope_description} - ${milestone.label}`,
        amount: milestone.amount
      });
      
      // Save CFDI info to milestone
      const { error: updateError } = await supabase.from("milestones")
        .update({
          cfdi_id: invoiceData.id,
          cfdi_xml_url: invoiceData.xml_url,
          cfdi_pdf_url: invoiceData.pdf_url,
          cfdi_status: "issued"
        })
        .eq("id", milestoneId);
        
      if (updateError) throw updateError;
      
      return NextResponse.json({ success: true, invoice: invoiceData });
    } catch (apiError: unknown) {
      console.error("Facturapi error:", apiError);
      
      await supabase.from("milestones").update({ cfdi_status: "pending_invoice" }).eq("id", milestoneId);
      
      return NextResponse.json({ 
        error: "Failed to generate CFDI. " + (apiError instanceof Error ? apiError.message : ""),
        code: "PAC_ERROR"
      }, { status: 500 });
    }
    
  } catch (err: unknown) {
    console.error("Invoice API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
