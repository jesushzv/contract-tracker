"use server";

import { createClient } from "@supabase/supabase-js";
import { Contract, Milestone, Profile, ContractStatus, MilestoneStatus, AuditLog } from "./types";
import crypto from "crypto";
import { headers, cookies } from "next/headers";

// Initialize Supabase Client
// These variables must be configured in Vercel's Environment Settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// In server actions, we use the service role key to bypass RLS when performing admin or client signatures,
// or we can use the default anon client. Let's create a client.
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

async function getCurrentUserId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.getAll().find((cookie) => 
      cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
    );

    if (authCookie) {
      const parsed = JSON.parse(authCookie.value);
      if (parsed?.user?.id) {
        return parsed.user.id;
      }
    }
  } catch (e) {
    console.error("Error reading Supabase auth cookie:", e);
  }

  // Fallback default profile UUID for sandbox/demo
  return "d8b67104-e3c3-4d37-88ab-8c9df4a2e5d9";
}

// SERVER ACTIONS FOR AUDIT LOGS
export async function getAuditLogs(contractId?: string): Promise<AuditLog[]> {
  let query = supabase.from("audit_logs").select("*");
  if (contractId) {
    query = query.eq("contract_id", contractId);
  }
  const { data, error } = await query.order("timestamp", { ascending: false });
  if (error || !data) return [];
  
  return data.map((row) => ({
    id: row.id,
    contractId: row.contract_id,
    action: row.action as AuditLog["action"],
    actor: row.actor as AuditLog["actor"],
    details: row.details,
    timestamp: row.timestamp,
    ip: row.ip,
    signature: row.signature
  }));
}

export async function addAuditLog(
  log: Omit<AuditLog, "id" | "timestamp">
): Promise<AuditLog> {
  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      contract_id: log.contractId,
      action: log.action,
      actor: log.actor,
      details: log.details,
      ip: log.ip,
      signature: log.signature
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("Error writing audit log to Supabase: " + (error?.message || "unknown error"));
  }

  return {
    id: data.id,
    contractId: data.contract_id,
    action: data.action as AuditLog["action"],
    actor: data.actor as AuditLog["actor"],
    details: data.details,
    timestamp: data.timestamp,
    ip: data.ip,
    signature: data.signature
  };
}

export async function getProfile(): Promise<Profile> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    // Return a default profile if none exists yet
    return {
      id: "demo-freelancer-uuid",
      email: "hector@freelancemx.dev",
      fullName: "Héctor J. Guerrero",
      rfc: "GUEH860710MX8",
      regimenFiscal: "626 - Régimen Simplificado de Confianza (RESICO)",
      codigoPostal: "06700",
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop&auto=format",
      signatureUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3a/John_Hancock_signature.svg",
      tier: "free",
      bankDetails: {
        clabe: "012180001509987654",
        bankName: "BBVA México",
        beneficiaryName: "Héctor J. Guerrero"
      }
    };
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    rfc: data.rfc,
    regimenFiscal: data.regimen_fiscal,
    codigoPostal: data.codigo_postal,
    logoUrl: data.logo_url || undefined,
    signatureUrl: data.signature_url || undefined,
    tier: data.tier || "free",
    bankDetails: {
      clabe: data.bank_details.clabe,
      bankName: data.bank_details.bankName,
      beneficiaryName: data.bank_details.beneficiaryName
    }
  };
}

export async function updateProfile(profile: Profile): Promise<Profile> {
  const userId = await getCurrentUserId();
  const targetId = userId && userId !== "demo-freelancer-uuid" ? userId : (profile.id && profile.id !== "demo-freelancer-uuid" ? profile.id : "c596e102-1200-4b2a-8888-888888888888");

  // Check if profile exists first
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("profiles")
      .update({
        email: profile.email,
        full_name: profile.fullName,
        rfc: profile.rfc,
        regimen_fiscal: profile.regimenFiscal,
        codigo_postal: profile.codigoPostal,
        logo_url: profile.logoUrl || null,
        signature_url: profile.signatureUrl || null,
        tier: profile.tier || "free",
        bank_details: profile.bankDetails,
        updated_at: new Date().toISOString()
      })
      .eq("id", targetId);

    if (error) throw new Error("Error updating Supabase profile: " + error.message);
  } else {
    // Create new profile record
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: targetId,
        email: profile.email,
        full_name: profile.fullName,
        rfc: profile.rfc,
        regimen_fiscal: profile.regimenFiscal,
        codigo_postal: profile.codigoPostal,
        logo_url: profile.logoUrl || null,
        signature_url: profile.signatureUrl || null,
        tier: profile.tier || "free",
        bank_details: profile.bankDetails
      });

    if (error) throw new Error("Error inserting Supabase profile: " + error.message);
  }

  return { ...profile, id: targetId };
}

export async function getContracts(): Promise<Contract[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("freelancer_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapContractFromDb);
}

export async function getContractById(id: string): Promise<Contract | null> {
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapContractFromDb(data);
}

export async function saveContract(contract: Contract): Promise<Contract> {
  const existing = await getContractById(contract.id);
  const isNew = !existing;

  const profile = await getProfile().catch(() => null);
  const freelancerId = profile?.id && profile.id !== "demo-freelancer-uuid" ? profile.id : "c596e102-1200-4b2a-8888-888888888888";

  const { error } = await supabase
    .from("contracts")
    .upsert({
      id: contract.id,
      freelancer_id: freelancerId,
      client_name: contract.clientName,
      client_email: contract.clientEmail,
      client_rfc: contract.clientRfc,
      client_regimen: contract.clientRegimen,
      client_postal: contract.clientPostal,
      scope_description: contract.scopeDescription,
      total_amount: contract.totalAmount,
      currency: contract.currency,
      status: contract.status,
      pdf_url: contract.pdfUrl,
      contract_hash: contract.contractHash,
      accepted_at: contract.acceptedAt,
      accepted_by_name: contract.acceptedByName,
      accepted_ip: contract.acceptedIp,
      freelancer_accepted_at: contract.freelancerAcceptedAt,
      freelancer_accepted_by_name: contract.freelancerAcceptedByName,
      freelancer_accepted_ip: contract.freelancerAcceptedIp,
      clabe: contract.clabe || profile?.bankDetails.clabe,
      bank_name: contract.bankName || profile?.bankDetails.bankName,
      beneficiary_name: contract.beneficiaryName || profile?.bankDetails.beneficiaryName,
      freelancer_rfc: contract.freelancerRfc || profile?.rfc,
      freelancer_regimen: contract.freelancerRegimen || profile?.regimenFiscal,
      freelancer_postal: contract.freelancerPostal || profile?.codigoPostal,
      retencion_isr: contract.retencionIsr || false,
      retencion_iva: contract.retencionIva || false,
      tax_withholding_amount: contract.taxWithholdingAmount || 0,
      iva_amount: contract.ivaAmount || 0,
      subtotal_amount: contract.subtotalAmount || 0,
      client_otp_code: contract.clientOtpCode || null,
      client_otp_verified: contract.clientOtpVerified || false,
      updated_at: new Date().toISOString()
    });

  if (error) throw new Error("Error saving contract to Supabase: " + error.message);
  
  if (isNew) {
    await addAuditLog({
      contractId: contract.id,
      action: "created",
      actor: "freelancer",
      details: `El contrato para "${contract.clientName}" fue creado y guardado como borrador.`
    });
  }

  return contract;
}

export async function getMilestones(contractId?: string): Promise<Milestone[]> {
  let query = supabase.from("milestones").select("*");
  if (contractId) {
    query = query.eq("contract_id", contractId);
  }
  
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error || !data) return [];
  
  return data.map(m => ({
    id: m.id,
    contractId: m.contract_id,
    label: m.label,
    amount: Number(m.amount),
    dueDate: m.due_date,
    status: m.status as MilestoneStatus,
    markedPaidAt: m.marked_paid_at,
    confirmedAt: m.confirmed_at,
    trackingReference: m.tracking_reference,
    transferredAmount: m.transferred_amount ? Number(m.transferred_amount) : undefined,
    created_at: m.created_at
  }));
}

export async function saveMilestones(milestones: Milestone[]): Promise<void> {
  const records = milestones.map(m => ({
    id: m.id,
    contract_id: m.contractId,
    label: m.label,
    amount: m.amount,
    due_date: m.dueDate,
    status: m.status,
    marked_paid_at: m.markedPaidAt,
    confirmed_at: m.confirmedAt,
    tracking_reference: m.trackingReference,
    transferred_amount: m.transferredAmount
  }));

  const { error } = await supabase
    .from("milestones")
    .upsert(records);

  if (error) throw new Error("Error saving milestones to Supabase: " + error.message);
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneStatus
): Promise<Milestone | null> {
  const updates: { 
    status: MilestoneStatus; 
    marked_paid_at: string | null; 
    confirmed_at: string | null; 
    tracking_reference: string | null;
    transferred_amount: number | null;
    receipt_url: string | null;
  } = { 
    status,
    marked_paid_at: null,
    confirmed_at: null,
    tracking_reference: null,
    transferred_amount: null,
    receipt_url: null
  };

  const current = await supabase
    .from("milestones")
    .select("status, marked_paid_at, confirmed_at, tracking_reference, transferred_amount, receipt_url")
    .eq("id", milestoneId)
    .single();

  const oldStatus = current.data?.status as MilestoneStatus || "pending";

  if (status === "confirmed" && oldStatus !== "marked_paid") {
    throw new Error("El hito debe haber sido reportado como transferido por el cliente antes de ser confirmado.");
  }

  if (status === "marked_paid" && oldStatus !== "requested") {
    throw new Error("Un hito solo puede ser marcado como transferido si ha sido solicitado previamente.");
  }

  if (status === "marked_paid") {
    updates.marked_paid_at = new Date().toISOString();
    if (current.data) {
      updates.tracking_reference = current.data.tracking_reference;
      updates.transferred_amount = current.data.transferred_amount ? Number(current.data.transferred_amount) : null;
      updates.receipt_url = current.data.receipt_url;
    }
  } else if (status === "confirmed") {
    updates.confirmed_at = new Date().toISOString();
    if (current.data) {
      updates.marked_paid_at = current.data.marked_paid_at;
      updates.tracking_reference = current.data.tracking_reference;
      updates.transferred_amount = current.data.transferred_amount ? Number(current.data.transferred_amount) : null;
      updates.receipt_url = current.data.receipt_url;
    }
  }

  const { data, error } = await supabase
    .from("milestones")
    .update(updates)
    .eq("id", milestoneId)
    .select()
    .single();

  if (error || !data) return null;
  
  const milestone = {
    id: data.id,
    contractId: data.contract_id,
    label: data.label,
    amount: Number(data.amount),
    dueDate: data.due_date,
    status: data.status as MilestoneStatus,
    markedPaidAt: data.marked_paid_at || undefined,
    confirmedAt: data.confirmed_at || undefined,
    trackingReference: data.tracking_reference || undefined,
    transferredAmount: data.transferred_amount ? Number(data.transferred_amount) : undefined,
    receiptUrl: data.receipt_url || undefined,
    created_at: data.created_at
  };

  await checkAndUpdateContractStatus(milestone.contractId);
  
  // Log milestone status events
  if (status !== oldStatus) {
    const isRollback = 
      (oldStatus === "confirmed") ||
      (oldStatus === "marked_paid" && status !== "confirmed") ||
      (oldStatus === "requested" && status === "pending");

    if (isRollback) {
      await addAuditLog({
        contractId: milestone.contractId,
        action: "milestone_requested",
        actor: "freelancer",
        details: `El freelancer revirtió el hito "${milestone.label}" de ${translateStatus(oldStatus)} a ${translateStatus(status)}.`
      });
    } else {
      if (status === "requested") {
        await addAuditLog({
          contractId: milestone.contractId,
          action: "milestone_requested",
          actor: "freelancer",
          details: `Cobro solicitado para el hito: "${milestone.label}" (Monto: $${milestone.amount}).`
        });
      } else if (status === "confirmed") {
        await addAuditLog({
          contractId: milestone.contractId,
          action: "milestone_confirmed",
          actor: "freelancer",
          details: `Pago confirmado y recibido para el hito: "${milestone.label}".`
        });
      }
    }
  }

  return milestone;
}

function translateStatus(s: string): string {
  if (s === "pending") return "Pendiente";
  if (s === "requested") return "Solicitado";
  if (s === "marked_paid") return "Transferido (Verificando)";
  if (s === "confirmed") return "Confirmado";
  return s;
}

// SERVER ACTION: Record client transfer reference and mark milestone as paid
export async function markMilestoneAsTransferred(
  milestoneId: string,
  trackingReference: string,
  transferredAmount?: number,
  receiptUrl?: string
): Promise<Milestone | null> {
  const current = await supabase
    .from("milestones")
    .select("status")
    .eq("id", milestoneId)
    .single();

  const oldStatus = current.data?.status as MilestoneStatus || "pending";
  if (oldStatus !== "requested") {
    throw new Error("El hito debe estar en estado 'Solicitado' antes de que el cliente lo marque como transferido.");
  }

  const updates: { 
    status: MilestoneStatus; 
    marked_paid_at: string; 
    tracking_reference: string; 
    transferred_amount?: number;
    receipt_url?: string;
  } = {
    status: "marked_paid",
    marked_paid_at: new Date().toISOString(),
    tracking_reference: trackingReference
  };
  if (transferredAmount !== undefined) {
    updates.transferred_amount = transferredAmount;
  }
  if (receiptUrl !== undefined) {
    updates.receipt_url = receiptUrl;
  }

  const { data, error } = await supabase
    .from("milestones")
    .update(updates)
    .eq("id", milestoneId)
    .select()
    .single();

  if (error || !data) return null;

  const milestone = {
    id: data.id,
    contractId: data.contract_id,
    label: data.label,
    amount: Number(data.amount),
    dueDate: data.due_date,
    status: data.status as MilestoneStatus,
    markedPaidAt: data.marked_paid_at || undefined,
    confirmedAt: data.confirmed_at || undefined,
    trackingReference: data.tracking_reference || undefined,
    transferredAmount: data.transferred_amount ? Number(data.transferred_amount) : undefined,
    receiptUrl: data.receipt_url || undefined,
    created_at: data.created_at
  };

  await checkAndUpdateContractStatus(milestone.contractId);

  // Log transfer
  await addAuditLog({
    contractId: milestone.contractId,
    action: "milestone_transferred",
    actor: "client",
    details: `El cliente reportó transferencia para "${milestone.label}" (Monto: $${transferredAmount || milestone.amount}, Ref: ${trackingReference}${receiptUrl ? ', con recibo adjunto' : ''}).`
  });

  return milestone;
}

async function checkAndUpdateContractStatus(contractId: string): Promise<void> {
  const contract = await getContractById(contractId);
  if (!contract) return;
  const milestones = await getMilestones(contractId);
  const allPaid = milestones.every(
    (m) => m.status === "marked_paid" || m.status === "confirmed"
  );
  if (allPaid && contract.status === "accepted") {
    const { error } = await supabase
      .from("contracts")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", contractId);

    if (!error) {
      await addAuditLog({
        contractId: contractId,
        action: "milestone_confirmed",
        actor: "system",
        details: "Todos los hitos han sido liquidados. Contrato marcado como Completado."
      });
    }
  } else if (!allPaid && contract.status === "completed") {
    const { error } = await supabase
      .from("contracts")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", contractId);

    if (!error) {
      await addAuditLog({
        contractId: contractId,
        action: "milestone_requested",
        actor: "system",
        details: "Un hito fue revertido. Contrato reactivado como Sellado."
      });
    }
  }
}

export async function generateClientOtp(contractId: string): Promise<string | null> {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const { error } = await supabase
    .from("contracts")
    .update({ client_otp_code: otpCode })
    .eq("id", contractId);

  if (error) {
    console.error("Error generating OTP:", error);
    return null;
  }
  return otpCode;
}

// CLIENT PORTAL: Client accepts & signs contract (moves to 'client_signed')
export async function acceptContract(
  contractId: string,
  clientName: string,
  otpCode: string
): Promise<Contract | null> {
  const contract = await getContractById(contractId);
  if (!contract) return null;

  if (contract.status !== "sent") {
    throw new Error("Solo se pueden firmar contratos en estado 'Enviado'.");
  }

  if (!contract.clientOtpCode || contract.clientOtpCode !== otpCode) {
    throw new Error("El código de verificación ingresado es incorrecto.");
  }

  const milestones = await getMilestones(contractId);

  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  let clientIp = "127.0.0.1";
  if (forwardedFor) {
    clientIp = forwardedFor.split(",")[0].trim();
  } else {
    clientIp = headerList.get("x-real-ip") || "127.0.0.1";
  }

  const payload = {
    contractId: contract.id,
    freelancerId: contract.freelancerId,
    clientName: contract.clientName,
    clientEmail: contract.clientEmail,
    scopeDescription: contract.scopeDescription,
    totalAmount: contract.totalAmount,
    currency: contract.currency,
    milestones: milestones.map(m => ({ label: m.label, amount: m.amount, dueDate: m.dueDate }))
  };

  const sha256Hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  const { data, error } = await supabase
    .from("contracts")
    .update({
      status: "client_signed",
      accepted_at: new Date().toISOString(),
      accepted_by_name: clientName,
      accepted_ip: clientIp,
      contract_hash: sha256Hash,
      client_otp_code: null,
      client_otp_verified: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", contractId)
    .select()
    .single();

  if (error || !data) return null;

  // Write audit log entry
  await addAuditLog({
    contractId: contract.id,
    action: "client_signed",
    actor: "client",
    details: `El cliente ${clientName} firmó el contrato digitalmente (Verificado con OTP).`,
    ip: clientIp,
    signature: sha256Hash
  });

  return mapContractFromDb(data);
}

// FREELANCER VETS & COUNTERSIGNS CONTRACT (moves to 'accepted' and locks)
export async function vetAndAcceptContract(
  contractId: string,
  freelancerName: string
): Promise<Contract | null> {
  const contract = await getContractById(contractId);
  if (!contract) return null;

  if (contract.status !== "client_signed") {
    throw new Error("El contrato debe estar firmado por el cliente para poder validarlo y contra-firmarlo.");
  }

  const milestones = await getMilestones(contractId);

  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  let freelancerIp = "127.0.0.1";
  if (forwardedFor) {
    freelancerIp = forwardedFor.split(",")[0].trim();
  } else {
    freelancerIp = headerList.get("x-real-ip") || "127.0.0.1";
  }

  const payload = {
    contractId: contract.id,
    freelancerId: contract.freelancerId,
    clientName: contract.clientName,
    clientEmail: contract.clientEmail,
    scopeDescription: contract.scopeDescription,
    totalAmount: contract.totalAmount,
    currency: contract.currency,
    milestones: milestones.map(m => ({ label: m.label, amount: m.amount, dueDate: m.dueDate })),
    clientAcceptedAt: contract.acceptedAt,
    clientAcceptedByName: contract.acceptedByName,
    clientAcceptedIp: contract.acceptedIp
  };

  const finalHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  const { data, error } = await supabase
    .from("contracts")
    .update({
      status: "accepted",
      freelancer_accepted_at: new Date().toISOString(),
      freelancer_accepted_by_name: freelancerName,
      freelancer_accepted_ip: freelancerIp,
      contract_hash: finalHash,
      updated_at: new Date().toISOString()
    })
    .eq("id", contractId)
    .select()
    .single();

  if (error || !data) return null;

  // Write audit log entry
  await addAuditLog({
    contractId: contract.id,
    action: "freelancer_accepted",
    actor: "freelancer",
    details: `El freelancer ${freelancerName} verificó y aprobó el contrato. Documento sellado y activo.`,
    ip: freelancerIp,
    signature: finalHash
  });

  if (milestones.length > 0 && milestones[0].status === "pending") {
    await updateMilestoneStatus(milestones[0].id, "requested");
  }

  return mapContractFromDb(data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapContractFromDb(row: any): Contract {
  return {
    id: row.id,
    freelancerId: row.freelancer_id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientRfc: row.client_rfc,
    clientRegimen: row.client_regimen,
    clientPostal: row.client_postal,
    scopeDescription: row.scope_description,
    totalAmount: Number(row.total_amount),
    currency: row.currency as 'MXN' | 'USD',
    status: row.status as ContractStatus,
    pdfUrl: row.pdf_url,
    contractHash: row.contract_hash,
    acceptedAt: row.accepted_at,
    acceptedByName: row.accepted_by_name,
    acceptedIp: row.accepted_ip,
    freelancerAcceptedAt: row.freelancer_accepted_at,
    freelancerAcceptedByName: row.freelancer_accepted_by_name,
    freelancerAcceptedIp: row.freelancer_accepted_ip,
    clabe: row.clabe,
    bankName: row.bank_name,
    beneficiaryName: row.beneficiary_name,
    freelancerRfc: row.freelancer_rfc,
    freelancerRegimen: row.freelancer_regimen,
    freelancerPostal: row.freelancer_postal,
    retencionIsr: !!row.retencion_isr,
    retencionIva: !!row.retencion_iva,
    taxWithholdingAmount: Number(row.tax_withholding_amount || 0),
    ivaAmount: Number(row.iva_amount || 0),
    subtotalAmount: Number(row.subtotal_amount || 0),
    clientOtpCode: row.client_otp_code,
    clientOtpVerified: !!row.client_otp_verified,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export async function loadSampleData(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId || userId === "demo-freelancer-uuid") return false;

  // Check if profile exists, if not create a default one
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: userId,
      email: "freelancer@ejemplo.com",
      full_name: "Freelancer Mexicano",
      rfc: "GUEH860710MX8",
      regimen_fiscal: "626 - Régimen Simplificado de Confianza (RESICO)",
      codigo_postal: "06700",
      bank_details: {
        clabe: "012180001509987654",
        bankName: "BBVA México",
        beneficiaryName: "Freelancer Mexicano"
      }
    });
  }

  // Check if contracts already exist for this user, if so don't double load
  const { data: existingContracts } = await supabase
    .from("contracts")
    .select("id")
    .eq("freelancer_id", userId)
    .limit(1);

  if (existingContracts && existingContracts.length > 0) {
    return true; // Already loaded or has active contracts
  }

  // Insert Sofia Garza contract
  const contractId = `c-sample-${userId.substring(0, 8)}`;
  const { error: cError } = await supabase.from("contracts").insert({
    id: contractId,
    freelancer_id: userId,
    client_name: "Sofía Garza (Studio Flora)",
    client_email: "sofia@studioflora.mx",
    client_rfc: "GASF920412HX8",
    client_regimen: "612 - Personas Físicas con Actividades Empresariales y Profesionales",
    client_postal: "06700",
    scope_description: "Rediseño completo de la identidad de marca, incluyendo logotipo, paleta de colores, tipografías y manual de identidad gráfica para Studio Flora.",
    total_amount: 30000.00,
    currency: "MXN",
    status: "accepted",
    clabe: "012180001509987654",
    bank_name: "BBVA México",
    beneficiary_name: "Freelancer Mexicano",
    freelancer_rfc: "GUEH860710MX8",
    freelancer_regimen: "626 - Régimen Simplificado de Confianza (RESICO)",
    freelancer_postal: "06700"
  });

  if (cError) {
    console.error("Error inserting sample contract:", cError);
    return false;
  }

  // Insert milestones
  await supabase.from("milestones").insert([
    {
      id: `m-sample-1-${userId.substring(0, 8)}`,
      contract_id: contractId,
      label: "Anticipo de inicio (50%)",
      amount: 15000.00,
      due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "requested"
    },
    {
      id: `m-sample-2-${userId.substring(0, 8)}`,
      contract_id: contractId,
      label: "Entrega de manual final (50%)",
      amount: 15000.00,
      due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "pending"
    }
  ]);

  // Write audit log entry
  await addAuditLog({
    contractId: contractId,
    action: "created",
    actor: "freelancer",
    details: "Contrato creado a partir de datos de ejemplo.",
    ip: "127.0.0.1"
  });

  return true;
}

export async function proposeContractRevision(
  contractId: string,
  reason: string
): Promise<Contract | null> {
  const contract = await getContractById(contractId);
  if (!contract) return null;

  const { data, error } = await supabase
    .from("contracts")
    .update({
      status: "draft",
      accepted_at: null,
      accepted_by_name: null,
      accepted_ip: null,
      freelancer_accepted_at: null,
      freelancer_accepted_by_name: null,
      freelancer_accepted_ip: null,
      contract_hash: null,
      client_otp_verified: false,
      client_otp_code: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", contractId)
    .select()
    .single();

  if (error || !data) return null;

  await addAuditLog({
    contractId: contractId,
    action: "revision_proposed",
    actor: "system",
    details: `Se solicitó revisión del contrato. Motivo: ${reason}`
  });

  return mapContractFromDb(data);
}
