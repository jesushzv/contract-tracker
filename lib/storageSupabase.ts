"use server";

import { createClient } from "@supabase/supabase-js";
import { Contract, Milestone, Profile, ContractStatus, MilestoneStatus } from "./types";
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
    bankDetails: data.bank_details
  };
}

export async function updateProfile(profile: Profile): Promise<Profile> {
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: profile.id,
      email: profile.email,
      full_name: profile.fullName,
      rfc: profile.rfc,
      regimen_fiscal: profile.regimenFiscal,
      codigo_postal: profile.codigoPostal,
      bank_details: profile.bankDetails,
      updated_at: new Date().toISOString()
    });

  if (error) throw new Error("Error updating profile in Supabase: " + error.message);
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
  const { error } = await supabase
    .from("contracts")
    .upsert({
      id: contract.id,
      freelancer_id: contract.freelancerId,
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
      clabe: contract.clabe,
      bank_name: contract.bankName,
      beneficiary_name: contract.beneficiaryName,
      freelancer_rfc: contract.freelancerRfc,
      freelancer_regimen: contract.freelancerRegimen,
      freelancer_postal: contract.freelancerPostal,
      updated_at: new Date().toISOString()
    });

  if (error) throw new Error("Error saving contract to Supabase: " + error.message);
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
  const updates: any = { status };
  if (status === "marked_paid") {
    updates.marked_paid_at = new Date().toISOString();
  } else if (status === "confirmed") {
    updates.confirmed_at = new Date().toISOString();
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
    markedPaidAt: data.marked_paid_at,
    confirmedAt: data.confirmed_at,
    trackingReference: data.tracking_reference,
    transferredAmount: data.transferred_amount ? Number(data.transferred_amount) : undefined,
    created_at: data.created_at
  };

  await checkAndUpdateContractStatus(milestone.contractId);
  return milestone;
}

export async function markMilestoneAsTransferred(
  milestoneId: string,
  trackingReference: string,
  transferredAmount?: number
): Promise<Milestone | null> {
  const updates: any = {
    status: "marked_paid",
    marked_paid_at: new Date().toISOString(),
    tracking_reference: trackingReference
  };
  if (transferredAmount !== undefined) {
    updates.transferred_amount = transferredAmount;
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
    markedPaidAt: data.marked_paid_at,
    confirmedAt: data.confirmed_at,
    trackingReference: data.tracking_reference,
    transferredAmount: data.transferred_amount ? Number(data.transferred_amount) : undefined,
    created_at: data.created_at
  };

  await checkAndUpdateContractStatus(milestone.contractId);
  return milestone;
}

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
    clientRfc: contract.clientRfc,
    clientRegimen: contract.clientRegimen,
    clientPostal: contract.clientPostal,
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
      status: "accepted",
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

  if (milestones.length > 0 && milestones[0].status === "pending") {
    await updateMilestoneStatus(milestones[0].id, "requested");
  }

  return mapContractFromDb(data);
}

// Helpers
async function checkAndUpdateContractStatus(contractId: string): Promise<void> {
  const contract = await getContractById(contractId);
  if (!contract) return;
  const milestones = await getMilestones(contractId);
  const allPaid = milestones.every(
    (m) => m.status === "marked_paid" || m.status === "confirmed"
  );
  if (allPaid && contract.status === "accepted") {
    contract.status = "completed";
    await saveContract(contract);
  } else if (!allPaid && contract.status === "completed") {
    contract.status = "accepted";
    await saveContract(contract);
  }
}

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
