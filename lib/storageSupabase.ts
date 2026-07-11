"use server";

import { createClient } from "@supabase/supabase-js";
import { Contract, Milestone, Profile, ContractStatus, MilestoneStatus, AuditLog } from "./types";
import crypto from "crypto";
import { headers } from "next/headers";

// Initialize Supabase Client
// These variables must be configured in Vercel's Environment Settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// In server actions, we use the service role key to bypass RLS when performing admin or client signatures,
// or we can use the default anon client. Let's create a client.
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

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
  // In production, we would query by the logged in user ID.
  // For the MVP, we query the single freelancer profile (or first profile)
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    // Return a default profile if none exists yet
    return {
      id: "demo-freelancer-uuid",
      email: "hector@freelancemx.dev",
      fullName: "Héctor J. Guerrero",
      rfc: "GUEH860710MX3",
      regimenFiscal: "626 - Régimen Simplificado de Confianza (RESICO)",
      codigoPostal: "06700",
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop&auto=format",
      signatureUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3a/John_Hancock_signature.svg",
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
    bankDetails: {
      clabe: data.bank_details.clabe,
      bankName: data.bank_details.bankName,
      beneficiaryName: data.bank_details.beneficiaryName
    }
  };
}

export async function updateProfile(profile: Profile): Promise<Profile> {
  // Check if profile exists first
  const current = await getProfile().catch(() => null);

  if (current && current.id !== "demo-freelancer-uuid") {
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
        bank_details: profile.bankDetails,
        updated_at: new Date().toISOString()
      })
      .eq("id", current.id);

    if (error) throw new Error("Error updating Supabase profile: " + error.message);
  } else {
    // Create new profile record
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: profile.id === "demo-freelancer-uuid" ? undefined : profile.id,
        email: profile.email,
        full_name: profile.fullName,
        rfc: profile.rfc,
        regimen_fiscal: profile.regimenFiscal,
        codigo_postal: profile.codigoPostal,
        logo_url: profile.logoUrl || null,
        signature_url: profile.signatureUrl || null,
        bank_details: profile.bankDetails
      });

    if (error) throw new Error("Error inserting Supabase profile: " + error.message);
  }

  return profile;
}

export async function getContracts(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
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

// CLIENT PORTAL: Client accepts & signs contract (moves to 'client_signed')
export async function acceptContract(
  contractId: string,
  clientName: string
): Promise<Contract | null> {
  const contract = await getContractById(contractId);
  if (!contract) return null;
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
    details: `El cliente ${clientName} firmó el contrato digitalmente.`,
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
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}
