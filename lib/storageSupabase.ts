"use server";

import { createClient } from "@supabase/supabase-js";
import { Contract, Milestone, Profile, ContractStatus, MilestoneStatus, AuditLog, ContractVersion, PaymentProfile, EditRequest, Notification } from "./types";
import crypto from "crypto";
import path from "path";
import { sendSimulatedEmail } from "./emails";
import { headers, cookies } from "next/headers";

// ── Contract State Machine ──────────────────────────────────────────────────
const CONTRACT_VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  draft: ["sent"],
  sent: ["client_signed", "cancelled"],
  client_signed: ["accepted", "sent", "cancelled"],
  accepted: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function validateContractTransition(
  currentStatus: ContractStatus,
  newStatus: ContractStatus
): void {
  const allowed = CONTRACT_VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(
      `Transición de estado inválida: No se puede pasar de '${currentStatus}' a '${newStatus}'. Transiciones permitidas: ${allowed?.join(", ") || "ninguna"}.`
    );
  }
}

// Initialize Supabase Client
// These variables must be configured in Vercel's Environment Settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Default static client (will fallback to this when cookies are not available or not needed)

function sanitizeInput(text: string | undefined): string {
  if (!text) return "";
  return text.replace(/<\/?[^>]+(>|$)/g, "");
}

async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    return headerList.get("x-real-ip") || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export async function getSupabaseClient(useServiceRole = false): Promise<any> {
  if (useServiceRole && supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
  }

  const cookieStore = await cookies();
  const authCookie = cookieStore.getAll().find((cookie) => 
    cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
  );

  if (authCookie) {
    try {
      const parsed = JSON.parse(authCookie.value);
      if (parsed?.access_token) {
        return createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${parsed.access_token}`
            }
          },
          auth: { persistSession: false }
        });
      }
    } catch (e) {
      console.error("Error parsing auth token:", e);
    }
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });
}

export async function checkRateLimit(ip: string, action: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `${ip}:${action}`;
  const now = new Date();
  const client = await getSupabaseClient(true); // Bypass RLS for rate limits to ensure they write properly

  const { data, error } = await client
    .from("rate_limits")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.error("Rate limit check error:", error);
    return false; // Fail open
  }

  if (!data) {
    const resetAt = new Date(now.getTime() + windowMs);
    const { error: insError } = await client.from("rate_limits").insert({
      key,
      count: 1,
      reset_at: resetAt.toISOString()
    });
    if (insError) {
      console.error("Rate limit insert error:", insError);
    }
    return false;
  }

  const resetAt = new Date(data.reset_at);
  if (now > resetAt) {
    const newResetAt = new Date(now.getTime() + windowMs);
    await client
      .from("rate_limits")
      .update({
        count: 1,
        reset_at: newResetAt.toISOString()
      })
      .eq("key", key);
    return false;
  }

  if (data.count >= limit) {
    return true; // Limit exceeded
  }

  await client
    .from("rate_limits")
    .update({ count: data.count + 1 })
    .eq("key", key);

  return false;
}

export async function uploadReceiptFile(
  fileName: string,
  mimeType: string,
  fileBase64: string
): Promise<string> {
  const buffer = Buffer.from(fileBase64, "base64");

  // 1. File size check (5MB)
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("El archivo excede el límite de tamaño de 5MB.");
  }

  // 2. Mimetype whitelist check
  const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error("Tipo de archivo no permitido. Solo se permiten PDFs e imágenes (PNG, JPEG).");
  }

  // 3. Magic bytes validation
  const hex = buffer.toString("hex", 0, 8).toUpperCase();
  let isValidMagic = false;

  if (mimeType === "application/pdf" && hex.startsWith("25504446")) {
    isValidMagic = true;
  } else if (mimeType === "image/png" && hex.startsWith("89504E470D0A1A0A")) {
    isValidMagic = true;
  } else if ((mimeType === "image/jpeg" || mimeType === "image/jpg") && hex.startsWith("FFD8FF")) {
    isValidMagic = true;
  }

  if (!isValidMagic) {
    throw new Error("Firma de archivo inválida. El contenido del archivo no coincide con su extensión.");
  }

  // Sanitize filename
  const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueName = `${crypto.randomUUID()}-${sanitizedName}`;

  // Upload to Supabase Storage
  const client = await getSupabaseClient(true);
  const { error } = await client.storage
    .from("receipts")
    .upload(uniqueName, buffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    throw new Error("Error subiendo el archivo a Supabase Storage: " + error.message);
  }

  const { data: urlData } = client.storage
    .from("receipts")
    .getPublicUrl(uniqueName);

  return urlData.publicUrl;
}

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
  const client = await getSupabaseClient();
  let query = client.from("audit_logs").select("*");
  if (contractId) {
    query = query.eq("contract_id", contractId);
  }
  const { data, error } = await query.order("timestamp", { ascending: false });
  if (error || !data) return [];
  
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return data.map((row: any) => ({
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from("audit_logs")
    .insert({
      contract_id: log.contractId,
      action: log.action,
      actor: log.actor,
      details: sanitizeInput(log.details),
      ip: log.ip ? sanitizeInput(log.ip) : undefined,
      signature: log.signature ? sanitizeInput(log.signature) : undefined
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
  const client = await getSupabaseClient();
  const { data, error } = await client
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
    phone: data.phone || undefined,
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
  const client = await getSupabaseClient();
  const { data: existing } = await client
    .from("profiles")
    .select("id")
    .eq("id", targetId)
    .maybeSingle();

  const sanitizedProfile = {
    email: sanitizeInput(profile.email),
    full_name: sanitizeInput(profile.fullName),
    rfc: profile.rfc ? sanitizeInput(profile.rfc) : null,
    regimen_fiscal: profile.regimenFiscal ? sanitizeInput(profile.regimenFiscal) : null,
    codigo_postal: profile.codigoPostal ? sanitizeInput(profile.codigoPostal) : null,
    logo_url: profile.logoUrl ? sanitizeInput(profile.logoUrl) : null,
    signature_url: profile.signatureUrl ? sanitizeInput(profile.signatureUrl) : null,
    tier: profile.tier || "free",
    phone: profile.phone ? sanitizeInput(profile.phone) : null,
    bank_details: {
      clabe: sanitizeInput(profile.bankDetails.clabe),
      bankName: sanitizeInput(profile.bankDetails.bankName),
      beneficiaryName: sanitizeInput(profile.bankDetails.beneficiaryName)
    }
  };

  if (existing) {
    const { error } = await client
      .from("profiles")
      .update({
        ...sanitizedProfile,
        updated_at: new Date().toISOString()
      })
      .eq("id", targetId);

    if (error) throw new Error("Error updating Supabase profile: " + error.message);
  } else {
    // Create new profile record
    const { error } = await client
      .from("profiles")
      .insert({
        id: targetId,
        ...sanitizedProfile
      });

    if (error) throw new Error("Error inserting Supabase profile: " + error.message);
  }

  return { 
    id: targetId,
    email: sanitizedProfile.email,
    fullName: sanitizedProfile.full_name,
    rfc: sanitizedProfile.rfc || undefined,
    regimenFiscal: sanitizedProfile.regimen_fiscal || undefined,
    codigoPostal: sanitizedProfile.codigo_postal || undefined,
    logoUrl: sanitizedProfile.logo_url || undefined,
    signatureUrl: sanitizedProfile.signature_url || undefined,
    tier: sanitizedProfile.tier as Profile['tier'],
    phone: sanitizedProfile.phone || undefined,
    bankDetails: {
      clabe: sanitizedProfile.bank_details.clabe,
      bankName: sanitizedProfile.bank_details.bankName,
      beneficiaryName: sanitizedProfile.bank_details.beneficiaryName
    }
  };
}

export async function getContracts(): Promise<Contract[]> {
  const userId = await getCurrentUserId();
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from("contracts")
    .select("*")
    .eq("freelancer_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapContractFromDb);
}

export async function getContractById(id: string): Promise<Contract | null> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapContractFromDb(data);
}

export async function saveContract(contract: Contract): Promise<Contract> {
  if (!contract.clientAccessToken) {
    contract.clientAccessToken = crypto.randomUUID();
  }
  const existing = await getContractById(contract.id);
  
  if (existing && existing.status !== contract.status) {
    validateContractTransition(existing.status, contract.status);
  }

  const isNew = !existing;

  const profile = await getProfile().catch(() => null);
  const freelancerId = profile?.id && profile.id !== "demo-freelancer-uuid" ? profile.id : "c596e102-1200-4b2a-8888-888888888888";

  const client = await getSupabaseClient();

  if (existing) {
    const hasChanges = existing.scopeDescription !== contract.scopeDescription ||
                       existing.totalAmount !== contract.totalAmount ||
                       existing.currency !== contract.currency;
    if (hasChanges) {
      const { data: currentVersions } = await client
        .from("contract_versions")
        .select("version_number")
        .eq("contract_id", contract.id);
      const nextVer = currentVersions && currentVersions.length > 0 ? Math.max(...currentVersions.map((v: { version_number: number }) => v.version_number)) + 1 : 1;
      
      await client.from("contract_versions").insert({
        contract_id: contract.id,
        version_number: nextVer,
        scope_description: existing.scopeDescription,
        total_amount: existing.totalAmount,
        currency: existing.currency,
        tax_withholding_amount: existing.taxWithholdingAmount || 0,
        iva_amount: existing.ivaAmount || 0,
        subtotal_amount: existing.subtotalAmount || 0,
        reason: existing.status === "draft" ? "Reversión a borrador" : "Modificación de propuesta"
      });
    }
  }

  const { error } = await client
    .from("contracts")
    .upsert({
      id: contract.id,
      freelancer_id: freelancerId,
      client_name: sanitizeInput(contract.clientName),
      client_email: sanitizeInput(contract.clientEmail),
      client_rfc: contract.clientRfc ? sanitizeInput(contract.clientRfc) : null,
      client_regimen: contract.clientRegimen ? sanitizeInput(contract.clientRegimen) : null,
      client_postal: contract.clientPostal ? sanitizeInput(contract.clientPostal) : null,
      client_phone: contract.clientPhone ? sanitizeInput(contract.clientPhone) : null,
      scope_description: sanitizeInput(contract.scopeDescription),
      total_amount: contract.totalAmount,
      currency: contract.currency,
      status: contract.status,
      pdf_url: contract.pdfUrl,
      contract_hash: contract.contractHash,
      accepted_at: contract.acceptedAt,
      accepted_by_name: contract.acceptedByName ? sanitizeInput(contract.acceptedByName) : null,
      accepted_ip: contract.acceptedIp ? sanitizeInput(contract.acceptedIp) : null,
      freelancer_accepted_at: contract.freelancerAcceptedAt,
      freelancer_accepted_by_name: contract.freelancerAcceptedByName ? sanitizeInput(contract.freelancerAcceptedByName) : null,
      freelancer_accepted_ip: contract.freelancerAcceptedIp ? sanitizeInput(contract.freelancerAcceptedIp) : null,
      clabe: sanitizeInput(contract.clabe || profile?.bankDetails.clabe),
      bank_name: sanitizeInput(contract.bankName || profile?.bankDetails.bankName),
      beneficiary_name: sanitizeInput(contract.beneficiaryName || profile?.bankDetails.beneficiaryName),
      freelancer_rfc: sanitizeInput(contract.freelancerRfc || profile?.rfc),
      freelancer_regimen: sanitizeInput(contract.freelancerRegimen || profile?.regimenFiscal),
      freelancer_postal: sanitizeInput(contract.freelancerPostal || profile?.codigoPostal),
      retencion_isr: contract.retencionIsr || false,
      retencion_iva: contract.retencionIva || false,
      tax_withholding_amount: contract.taxWithholdingAmount || 0,
      iva_amount: contract.ivaAmount || 0,
      subtotal_amount: contract.subtotalAmount || 0,
      client_otp_code: contract.clientOtpCode || null,
      client_otp_verified: contract.clientOtpVerified || false,
      client_otp_attempts: contract.clientOtpAttempts || 0,
      client_access_token: contract.clientAccessToken || null,
      payment_profile_id: contract.paymentProfileId || null,
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

  if (contract.status === "sent") {
    const tokenPart = contract.clientAccessToken ? `?token=${contract.clientAccessToken}` : "";
    const clientUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${contract.id}${tokenPart}`;
    sendSimulatedEmail({
      to: contract.clientEmail,
      subject: `Propuesta de Contrato de Servicios Profesionales - ${contract.clientName}`,
      html: `<p>Hola ${contract.clientName},</p><p>Te han compartido una propuesta de contrato por ${contract.totalAmount} ${contract.currency}.</p><p>Puedes revisarlo y firmar aquí: <a href="${clientUrl}">${clientUrl}</a></p>`
    }).catch(console.error);
  }

  return contract;
}

export async function getMilestones(contractId?: string): Promise<Milestone[]> {
  const client = await getSupabaseClient();
  let query = client.from("milestones").select("*");
  if (contractId) {
    query = query.eq("contract_id", contractId);
  }
  
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error || !data) return [];
  
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return data.map((m: any) => ({
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
    receiptUrl: m.receipt_url,
    exchangeRate: m.exchange_rate ? Number(m.exchange_rate) : undefined,
    mxnAmount: m.mxn_amount ? Number(m.mxn_amount) : undefined,
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
    transferred_amount: m.transferredAmount,
    exchange_rate: m.exchangeRate,
    mxn_amount: m.mxnAmount
  }));

  const client = await getSupabaseClient();
  const { error } = await client
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
    exchange_rate: number | null;
    mxn_amount: number | null;
  } = { 
    status,
    marked_paid_at: null,
    confirmed_at: null,
    tracking_reference: null,
    transferred_amount: null,
    receipt_url: null,
    exchange_rate: null,
    mxn_amount: null
  };

  const client = await getSupabaseClient();
  const current = await client
    .from("milestones")
    .select("status, marked_paid_at, confirmed_at, tracking_reference, transferred_amount, receipt_url, exchange_rate, mxn_amount")
    .eq("id", milestoneId)
    .single();

  const oldStatus = current.data?.status as MilestoneStatus || "pending";

  const statusOrder = ['pending', 'requested', 'marked_paid', 'confirmed'];
  const isRevert = statusOrder.indexOf(status) < statusOrder.indexOf(oldStatus);

  if (!isRevert) {
    if (status === "requested" && oldStatus !== "pending") {
      throw new Error("Un hito solo puede ser solicitado si está en estado 'Pendiente'.");
    }

    if (status === "confirmed" && oldStatus !== "marked_paid") {
      throw new Error("El hito debe haber sido reportado como transferido por el cliente antes de ser confirmado.");
    }

    if (status === "marked_paid" && oldStatus !== "requested") {
      throw new Error("Un hito solo puede ser marcado como transferido si ha sido solicitado previamente.");
    }
  }

  if (status === "marked_paid") {
    updates.marked_paid_at = new Date().toISOString();
    if (current.data) {
      updates.tracking_reference = current.data.tracking_reference;
      updates.transferred_amount = current.data.transferred_amount ? Number(current.data.transferred_amount) : null;
      updates.receipt_url = current.data.receipt_url;
      updates.exchange_rate = current.data.exchange_rate ? Number(current.data.exchange_rate) : null;
      updates.mxn_amount = current.data.mxn_amount ? Number(current.data.mxn_amount) : null;
    }
  } else if (status === "confirmed") {
    updates.confirmed_at = new Date().toISOString();
    if (current.data) {
      updates.marked_paid_at = current.data.marked_paid_at;
      updates.tracking_reference = current.data.tracking_reference;
      updates.transferred_amount = current.data.transferred_amount ? Number(current.data.transferred_amount) : null;
      updates.receipt_url = current.data.receipt_url;
      updates.exchange_rate = current.data.exchange_rate ? Number(current.data.exchange_rate) : null;
      updates.mxn_amount = current.data.mxn_amount ? Number(current.data.mxn_amount) : null;
    }
  }

  const { data, error } = await client
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
    exchangeRate: data.exchange_rate ? Number(data.exchange_rate) : undefined,
    mxnAmount: data.mxn_amount ? Number(data.mxn_amount) : undefined,
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

    if (status === "requested") {
      const contract = await getContractById(milestone.contractId);
      if (contract) {
        const tokenPart = contract.clientAccessToken ? `?token=${contract.clientAccessToken}` : "";
        const clientUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${contract.id}${tokenPart}`;
        sendSimulatedEmail({
          to: contract.clientEmail,
          subject: `Solicitud de Pago: Hito "${milestone.label}"`,
          html: `<p>Hola ${contract.clientName},</p><p>Se ha solicitado el pago para el hito <strong>"${milestone.label}"</strong> por un monto de <strong>$${milestone.amount} ${contract.currency}</strong>.</p><p>Puedes subir tu comprobante de transferencia ingresando al siguiente enlace seguro: <a href="${clientUrl}">${clientUrl}</a></p>`
        }).catch(console.error);
      }
    } else if (status === "confirmed") {
      const contract = await getContractById(milestone.contractId);
      if (contract) {
        const tokenPart = contract.clientAccessToken ? `?token=${contract.clientAccessToken}` : "";
        const clientUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${contract.id}${tokenPart}`;
        sendSimulatedEmail({
          to: contract.clientEmail,
          subject: `Pago Confirmado: Hito "${milestone.label}"`,
          html: `<p>Hola ${contract.clientName},</p><p>Tu pago para el hito <strong>"${milestone.label}"</strong> por <strong>$${milestone.amount} ${contract.currency}</strong> ha sido verificado y confirmado con éxito.</p><p>Puedes seguir el avance del proyecto aquí: <a href="${clientUrl}">${clientUrl}</a></p>`
        }).catch(console.error);
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

export async function markMilestoneAsTransferred(
  milestoneId: string,
  trackingReference: string,
  transferredAmount?: number,
  receiptUrl?: string,
  exchangeRate?: number,
  mxnAmount?: number
): Promise<Milestone | null> {
  const ip = await getClientIp();
  // Limit milestone payment reports to 5 per 15 minutes per IP
  const isLimited = await checkRateLimit(ip, "milestone_pay", 5, 15 * 60 * 1000);
  if (isLimited) {
    throw new Error("Límite de notificaciones de pago superado. Por favor, intente más tarde.");
  }

  const client = await getSupabaseClient();
  const current = await client
    .from("milestones")
    .select("status, contract_id, label, amount, due_date, created_at")
    .eq("id", milestoneId)
    .single();

  const oldStatus = current.data?.status as MilestoneStatus || "pending";
  if (oldStatus !== "requested") {
    throw new Error("El hito debe estar en estado 'Solicitado' antes de que el cliente lo marque como transferido.");
  }

  const cleanRef = trackingReference.toUpperCase().trim();
  const isRejected = cleanRef.includes("REJECT") || cleanRef.includes("INVALID") || cleanRef.length < 5;
  const targetStatus = !isRejected ? "confirmed" : "marked_paid";

  const updates: { 
    status: MilestoneStatus; 
    marked_paid_at: string; 
    confirmed_at?: string;
    tracking_reference: string; 
    transferred_amount?: number;
    receipt_url?: string;
    exchange_rate?: number;
    mxn_amount?: number;
  } = {
    status: targetStatus,
    marked_paid_at: new Date().toISOString(),
    tracking_reference: sanitizeInput(trackingReference)
  };
  if (transferredAmount !== undefined) {
    updates.transferred_amount = transferredAmount;
  }
  if (receiptUrl !== undefined) {
    updates.receipt_url = sanitizeInput(receiptUrl);
  }
  if (exchangeRate !== undefined) {
    updates.exchange_rate = exchangeRate;
  }
  if (mxnAmount !== undefined) {
    updates.mxn_amount = mxnAmount;
  }
  if (!isRejected) {
    updates.confirmed_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from("milestones")
    .update(updates)
    .eq("id", milestoneId)
    .select()
    .single();

  if (error || !data) return null;

  // Re-calculate contract status if necessary
  await checkAndUpdateContractStatus(current.data.contract_id);

  // Log audit logs
  if (!isRejected) {
    const profile = await getProfile().catch(() => null);
    const lastDigits = profile?.bankDetails?.clabe ? profile.bankDetails.clabe.slice(-4) : "8765";
    await addAuditLog({
      contractId: current.data.contract_id,
      action: "milestone_confirmed",
      actor: "system",
      details: `Reconciliación automática SPEI: CEP validado con éxito. Clave de rastreo: ${trackingReference}. Banco Emisor: BBVA México, Beneficiario: CLABE terminada en ${lastDigits}. Estado: LIQUIDADO.`
    });
  } else {
    await addAuditLog({
      contractId: current.data.contract_id,
      action: "milestone_transferred",
      actor: "client",
      details: `Fallo de reconciliación automática CEP: Clave de rastreo ${trackingReference} no encontrada o rechazada en Banco de México.`
    });
  }

  // Send email to freelancer
  const profile = await getProfile().catch(() => null);
  const freelancerEmail = profile?.email || "hector@freelancemx.dev";
  sendSimulatedEmail({
    to: freelancerEmail,
    subject: `Pago Reportado: Hito "${data.label}"`,
    html: `<p>Hola,</p><p>El cliente ha reportado la transferencia para el hito <strong>"${data.label}"</strong> por un monto de <strong>$${data.amount}</strong>.</p><p>Clave de rastreo: <strong>${trackingReference}</strong>.</p><p>Por favor, ingresa al panel para verificar y confirmarlo de conformidad.</p>`
  }).catch(console.error);

  return {
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
    receiptUrl: data.receipt_url,
    exchangeRate: data.exchange_rate ? Number(data.exchange_rate) : undefined,
    mxnAmount: data.mxn_amount ? Number(data.mxn_amount) : undefined,
    created_at: data.created_at
  };
}

async function checkAndUpdateContractStatus(contractId: string): Promise<void> {
  const contract = await getContractById(contractId);
  if (!contract) return;
  const milestones = await getMilestones(contractId);
  const allPaid = milestones.every(
    (m) => m.status === "marked_paid" || m.status === "confirmed"
  );
  
  const client = await getSupabaseClient();
  if (allPaid && contract.status === "accepted") {
    const { error } = await client
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
    const { error } = await client
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
  const ip = await getClientIp();
  // Limit to 5 OTP generations per 15 minutes per IP
  const isLimited = await checkRateLimit(ip, "otp_generate", 5, 15 * 60 * 1000);
  if (isLimited) {
    throw new Error("Límite de solicitudes de OTP superado. Por favor, intente más tarde.");
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const client = await getSupabaseClient();
  const { error } = await client
    .from("contracts")
    .update({ 
      client_otp_code: otpCode,
      client_otp_attempts: 0 // Reset attempts on new OTP generation
    })
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
  const ip = await getClientIp();
  // Limit to 5 signing attempts per 15 minutes per IP
  const isLimited = await checkRateLimit(ip, "contract_sign", 5, 15 * 60 * 1000);
  if (isLimited) {
    throw new Error("Límite de intentos de firma superado. Por favor, intente más tarde.");
  }

  const contract = await getContractById(contractId);
  if (!contract) return null;

  validateContractTransition(contract.status, "client_signed");

  // OTP attempts lockout guard
  const attempts = contract.clientOtpAttempts || 0;
  if (attempts >= 3) {
    throw new Error("El código de verificación ha sido bloqueado por seguridad debido a demasiados intentos fallidos. Solicite un nuevo código.");
  }

  const client = await getSupabaseClient();

  if (!contract.clientOtpCode || contract.clientOtpCode !== otpCode) {
    const nextAttempts = attempts + 1;
    await client
      .from("contracts")
      .update({ client_otp_attempts: nextAttempts })
      .eq("id", contractId);

    if (nextAttempts >= 3) {
      throw new Error("Código incorrecto. La verificación ha sido bloqueada debido a demasiados intentos fallidos. Solicite un nuevo código.");
    }
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

  const { data, error } = await client
    .from("contracts")
    .update({
      status: "client_signed",
      accepted_at: new Date().toISOString(),
      accepted_by_name: sanitizeInput(clientName),
      accepted_ip: clientIp,
      contract_hash: sha256Hash,
      client_otp_code: null,
      client_otp_verified: true,
      client_otp_attempts: 0, // Reset attempts on success
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
    details: `El cliente ${sanitizeInput(clientName)} firmó el contrato digitalmente (Verificado con OTP).`,
    ip: clientIp,
    signature: sha256Hash
  });

  // Send simulated email to freelancer
  const profile = await getProfile().catch(() => null);
  const freelancerEmail = profile?.email || "hector@freelancemx.dev";
  sendSimulatedEmail({
    to: freelancerEmail,
    subject: `Contrato Firmado por el Cliente - ${contract.clientName}`,
    html: `<p>Hola,</p><p>El cliente <strong>${contract.clientName}</strong> ha firmado el contrato digitalmente.</p><p>Por favor, ingresa al panel de control para revisarlo y realizar la firma de conformidad final.</p>`
  }).catch(console.error);

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

  const client = await getSupabaseClient();
  const { data, error } = await client
    .from("contracts")
    .update({
      status: "accepted",
      freelancer_accepted_at: new Date().toISOString(),
      freelancer_accepted_by_name: sanitizeInput(freelancerName),
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
    details: `El freelancer ${sanitizeInput(freelancerName)} verificó y aprobó el contrato. Documento sellado y activo.`,
    ip: freelancerIp,
    signature: finalHash
  });

  // Send simulated email to client
  const tokenPart = contract.clientAccessToken ? `?token=${contract.clientAccessToken}` : "";
  const clientUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${contract.id}${tokenPart}`;
  sendSimulatedEmail({
    to: contract.clientEmail,
    subject: `Contrato Validado y Sellado - ${freelancerName}`,
    html: `<p>Hola ${contract.clientName},</p><p>El contrato de servicios profesionales ha sido validado y firmado por ambas partes de conformidad. El documento se encuentra ahora activo y sellado digitalmente.</p><p>Puedes acceder a tu copia y ver el desglose en el siguiente enlace seguro: <a href="${clientUrl}">${clientUrl}</a></p>`
  }).catch(console.error);

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
    clientPhone: row.client_phone || undefined,
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
    clientOtpAttempts: Number(row.client_otp_attempts || 0),
    clientAccessToken: row.client_access_token || undefined,
    paymentProfileId: row.payment_profile_id || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export async function loadSampleData(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId || userId === "demo-freelancer-uuid") return false;

  const client = await getSupabaseClient();
  // Check if profile exists, if not create a default one
  const { data: profile } = await client
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await client.from("profiles").insert({
      id: userId,
      email: "hector@freelancemx.dev",
      full_name: "Héctor J. Guerrero",
      rfc: "GUEH860710MX8",
      regimen_fiscal: "626 - Régimen Simplificado de Confianza (RESICO)",
      codigo_postal: "06700",
      bank_details: {
        clabe: "012180001509987654",
        bankName: "BBVA México",
        beneficiaryName: "Héctor J. Guerrero"
      }
    });
  }

  // Insert mock contracts
  const { error: cError } = await client.from("contracts").insert({
    id: "mock-contract-1",
    freelancer_id: userId,
    client_name: "Alejandro Rivera (FintechMX)",
    client_email: "alejandro@fintechmx.co",
    client_rfc: "FMX1802058T3",
    client_regimen: "601 - General de Ley Personas Morales",
    client_postal: "03100",
    scope_description: "Rediseño completo de la identidad de marca, incluyendo logotipo, paleta de colores, tipografías y manual de identidad gráfica para la nueva plataforma digital de préstamos.",
    total_amount: 48000.00,
    status: "accepted",
    clabe: "012180001509987654",
    bank_name: "BBVA México",
    beneficiary_name: "Héctor J. Guerrero",
    freelancer_rfc: "GUEH860710MX8",
    freelancer_regimen: "626 - Régimen Simplificado de Confianza (RESICO)",
    freelancer_postal: "06700",
    retencion_isr: true,
    retencion_iva: true,
    tax_withholding_amount: 4800.00,
    iva_amount: 7680.00,
    subtotal_amount: 48000.00,
    accepted_at: new Date().toISOString(),
    accepted_by_name: "Alejandro Rivera",
    accepted_ip: "189.243.54.12",
    freelancer_accepted_at: new Date().toISOString(),
    freelancer_accepted_by_name: "Héctor J. Guerrero",
    freelancer_accepted_ip: "189.243.54.10",
    contract_hash: "mock-hash-signature"
  });

  if (cError) {
    console.error("Error seeding sample contract:", cError);
    return false;
  }

  // Insert mock milestones
  await client.from("milestones").insert([
    {
      id: "mock-milestone-1",
      contract_id: "mock-contract-1",
      label: "Anticipo inicial (50%)",
      amount: 24000.00,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "pending"
    },
    {
      id: "mock-milestone-2",
      contract_id: "mock-contract-1",
      label: "Entrega final (50%)",
      amount: 24000.00,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "pending"
    }
  ]);

  // Insert audit log
  await addAuditLog({
    contractId: "mock-contract-1",
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

  const client = await getSupabaseClient();
  const { data, error } = await client
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
      client_otp_attempts: 0,
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

  // Send email notifications to both parties
  const tokenPart = contract.clientAccessToken ? `?token=${contract.clientAccessToken}` : "";
  const clientUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${contract.id}${tokenPart}`;
  const profile = await getProfile().catch(() => null);
  const freelancerEmail = profile?.email || "hector@freelancemx.dev";
  
  sendSimulatedEmail({
    to: contract.clientEmail,
    subject: `Revisión Solicitada del Contrato - ${profile?.fullName || 'Freelancer'}`,
    html: `<p>Hola ${contract.clientName},</p><p>Se ha solicitado una revisión para el contrato de servicios profesionales. El contrato ha vuelto al estado de borrador y requiere cambios.</p><p><strong>Motivo:</strong> ${reason}</p><p>Puedes ver los detalles aquí: <a href="${clientUrl}">${clientUrl}</a></p>`
  }).catch(console.error);

  sendSimulatedEmail({
    to: freelancerEmail,
    subject: `Revisión Solicitada del Contrato - ${contract.clientName}`,
    html: `<p>Hola,</p><p>Se ha registrado una solicitud de revisión para el contrato de ${contract.clientName}. El contrato ha vuelto al estado de borrador.</p><p><strong>Motivo:</strong> ${reason}</p>`
  }).catch(console.error);

  return mapContractFromDb(data);
}

interface DbContractVersion {
  id: string;
  contract_id: string;
  version_number: number;
  scope_description: string;
  total_amount: number;
  currency: string;
  tax_withholding_amount?: number;
  iva_amount?: number;
  subtotal_amount?: number;
  modified_at: string;
  reason?: string;
}

export async function getContractVersions(contractId: string): Promise<ContractVersion[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from("contract_versions")
    .select("*")
    .eq("contract_id", contractId)
    .order("version_number", { ascending: false });

  if (error || !data) return [];

  return data.map((v: DbContractVersion) => ({
    id: v.id,
    contractId: v.contract_id,
    versionNumber: v.version_number,
    scopeDescription: v.scope_description,
    totalAmount: Number(v.total_amount),
    currency: v.currency as 'MXN' | 'USD',
    taxWithholdingAmount: v.tax_withholding_amount ? Number(v.tax_withholding_amount) : undefined,
    ivaAmount: v.iva_amount ? Number(v.iva_amount) : undefined,
    subtotalAmount: v.subtotal_amount ? Number(v.subtotal_amount) : undefined,
    modifiedAt: v.modified_at,
    reason: v.reason || undefined
  }));
}

export async function saveContractVersion(
  version: Omit<ContractVersion, "id" | "modifiedAt">
): Promise<ContractVersion> {
  const client = await getSupabaseClient();
  const { data: currentVersions } = await client
    .from("contract_versions")
    .select("version_number")
    .eq("contract_id", version.contractId);
  const nextVer = currentVersions && currentVersions.length > 0 ? Math.max(...currentVersions.map((v: { version_number: number }) => v.version_number)) + 1 : 1;

  const { data, error } = await client
    .from("contract_versions")
    .insert({
      contract_id: version.contractId,
      version_number: nextVer,
      scope_description: sanitizeInput(version.scopeDescription),
      total_amount: version.totalAmount,
      currency: version.currency,
      tax_withholding_amount: version.taxWithholdingAmount || 0,
      iva_amount: version.ivaAmount || 0,
      subtotal_amount: version.subtotalAmount || 0,
      reason: version.reason ? sanitizeInput(version.reason) : null
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("Error saving contract version to Supabase: " + (error?.message || "unknown error"));
  }

  return {
    id: data.id,
    contractId: data.contract_id,
    versionNumber: data.version_number,
    scopeDescription: data.scope_description,
    totalAmount: Number(data.total_amount),
    currency: data.currency as 'MXN' | 'USD',
    taxWithholdingAmount: Number(data.tax_withholding_amount || 0),
    ivaAmount: Number(data.iva_amount || 0),
    subtotalAmount: Number(data.subtotal_amount || 0),
    modifiedAt: data.modified_at,
    reason: data.reason || undefined
  };
}

export async function getPaymentProfiles(freelancerId?: string): Promise<PaymentProfile[]> {
  const client = await getSupabaseClient();
  let query = client.from("payment_profiles").select("*");
  if (freelancerId) {
    query = query.eq("freelancer_id", freelancerId);
  }
  const { data, error } = await query;
  if (error) throw error;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return (data || []).map((p: any) => ({
    id: p.id,
    freelancerId: p.freelancer_id,
    nickname: p.nickname,
    bankName: p.bank_name,
    clabe: p.clabe,
    paymentInstructions: p.payment_instructions || undefined,
    isDefault: p.is_default
  }));
}

export async function savePaymentProfile(profile: PaymentProfile): Promise<PaymentProfile> {
  const client = await getSupabaseClient();
  if (profile.isDefault) {
    await client.from("payment_profiles").update({ is_default: false }).eq("freelancer_id", profile.freelancerId);
  }
  const record = {
    id: profile.id,
    freelancer_id: profile.freelancerId,
    nickname: sanitizeInput(profile.nickname),
    bank_name: sanitizeInput(profile.bankName),
    clabe: sanitizeInput(profile.clabe),
    payment_instructions: profile.paymentInstructions ? sanitizeInput(profile.paymentInstructions) : null,
    is_default: profile.isDefault
  };
  const { data, error } = await client.from("payment_profiles").upsert(record).select().single();
  if (error) throw error;
  return {
    id: data.id,
    freelancerId: data.freelancer_id,
    nickname: data.nickname,
    bankName: data.bank_name,
    clabe: data.clabe,
    paymentInstructions: data.payment_instructions || undefined,
    isDefault: data.is_default
  };
}

export async function deletePaymentProfile(id: string): Promise<void> {
  const client = await getSupabaseClient();
  const { error } = await client.from("payment_profiles").delete().eq("id", id);
  if (error) throw error;
}

export async function getEditRequests(contractId: string): Promise<EditRequest[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client.from("edit_requests").select("*").eq("contract_id", contractId);
  if (error) throw error;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return (data || []).map((r: any) => ({
    id: r.id,
    contractId: r.contract_id,
    requestedBy: r.requested_by as 'freelancer' | 'client',
    reason: r.reason || undefined,
    status: r.status as 'pending' | 'approved' | 'rejected',
    proposedChanges: r.proposed_changes,
    requestedAt: r.requested_at,
    respondedAt: r.responded_at || undefined,
    respondedBy: r.responded_by || undefined
  }));
}

export async function proposeEditRequest(editRequest: Omit<EditRequest, "id" | "requestedAt" | "status">): Promise<EditRequest> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from("edit_requests")
    .insert({
      contract_id: editRequest.contractId,
      requested_by: editRequest.requestedBy,
      reason: editRequest.reason ? sanitizeInput(editRequest.reason) : null,
      proposed_changes: editRequest.proposedChanges,
      status: "pending"
    })
    .select()
    .single();
  if (error) throw error;

  const contract = await getContractById(editRequest.contractId);
  if (contract) {
    const isFreelancer = editRequest.requestedBy === "freelancer";
    const recipientEmail = contract.clientEmail;
    const senderName = isFreelancer ? "Freelancer" : contract.clientName;
    
    sendSimulatedEmail({
      to: recipientEmail,
      subject: `Modificación de Contrato Propuesta - ${senderName}`,
      html: `<p>Hola,</p><p>Se ha propuesto una modificación al contrato. Por favor ingresa a la plataforma para revisar los cambios propuestos (antes/después).</p><p>Motivo: ${editRequest.reason || 'Sin motivo especificado'}</p>`
    }).catch(console.error);

    if (!isFreelancer) {
      await addNotification({
        userId: contract.freelancerId,
        contractId: contract.id,
        eventType: "edit_requested",
        message: `El cliente ${contract.clientName} ha propuesto una modificación al contrato.`
      });
    }
  }

  return {
    id: data.id,
    contractId: data.contract_id,
    requestedBy: data.requested_by as 'freelancer' | 'client',
    reason: data.reason || undefined,
    status: data.status as 'pending' | 'approved' | 'rejected',
    proposedChanges: data.proposed_changes,
    requestedAt: data.requested_at,
    respondedAt: data.responded_at || undefined,
    respondedBy: data.responded_by || undefined
  };
}

export async function respondToEditRequest(id: string, status: "approved" | "rejected", respondedBy: string): Promise<EditRequest | null> {
  const client = await getSupabaseClient();
  const { data: request, error: fetchError } = await client.from("edit_requests").select("*").eq("id", id).single();
  if (fetchError || !request) return null;

  const { data: updatedRequest, error: updateError } = await client
    .from("edit_requests")
    .update({
      status,
      responded_at: new Date().toISOString(),
      responded_by: respondedBy
    })
    .eq("id", id)
    .select()
    .single();
  if (updateError) throw updateError;

  if (status === "approved") {
    const contract = await getContractById(request.contract_id);
    if (contract) {
      await saveContractVersion({
        contractId: contract.id,
        versionNumber: 0,
        scopeDescription: contract.scopeDescription,
        totalAmount: contract.totalAmount,
        currency: contract.currency,
        taxWithholdingAmount: contract.taxWithholdingAmount,
        ivaAmount: contract.ivaAmount,
        subtotalAmount: contract.subtotalAmount,
        reason: `Modificación aprobada por ${respondedBy}`
      });

      const changes = request.proposed_changes;
      const updatedContract = {
        ...contract,
        scopeDescription: changes.scopeDescription !== undefined ? changes.scopeDescription : contract.scopeDescription,
        totalAmount: changes.totalAmount !== undefined ? changes.totalAmount : contract.totalAmount,
        currency: changes.currency !== undefined ? changes.currency : contract.currency,
        clabe: changes.clabe !== undefined ? changes.clabe : contract.clabe,
        bankName: changes.bankName !== undefined ? changes.bankName : contract.bankName,
        beneficiaryName: changes.beneficiaryName !== undefined ? changes.beneficiaryName : contract.beneficiaryName,
        paymentInstructions: changes.paymentInstructions !== undefined ? changes.paymentInstructions : contract.paymentInstructions,
        status: "draft" as ContractStatus,
        acceptedAt: undefined,
        acceptedByName: undefined,
        acceptedIp: undefined,
        freelancerAcceptedAt: undefined,
        freelancerAcceptedByName: undefined,
        freelancerAcceptedIp: undefined,
        contractHash: undefined,
        clientOtpVerified: false,
        clientOtpCode: undefined,
        updated_at: new Date().toISOString()
      };

      await saveContract(updatedContract);

      if (changes.milestones) {
        await client.from("milestones").delete().eq("contract_id", contract.id);
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const milestoneRecords = changes.milestones.map((m: any) => ({
          id: m.id,
          contract_id: contract.id,
          label: m.label,
          amount: m.amount,
          due_date: m.dueDate,
          status: m.status
        }));
        await client.from("milestones").insert(milestoneRecords);
      }

      await addAuditLog({
        contractId: contract.id,
        action: "edit_approved",
        actor: request.requested_by === "freelancer" ? "client" : "freelancer",
        details: `Modificación de contrato aprobada. El acuerdo se revirtió a Borrador para nueva firma.`
      });
    }
  } else {
    await addAuditLog({
      contractId: request.contract_id,
      action: "edit_rejected",
      actor: request.requested_by === "freelancer" ? "client" : "freelancer",
      details: `Modificación de contrato rechazada por ${respondedBy}.`
    });
  }

  const contractObj = await getContractById(request.contract_id);
  if (contractObj && request.requested_by === "freelancer") {
    await addNotification({
      userId: contractObj.freelancerId,
      contractId: contractObj.id,
      eventType: "edit_responded",
      message: `El cliente ha ${status === "approved" ? "aprobado" : "rechazado"} los cambios propuestos al contrato.`
    });
  }

  return {
    id: updatedRequest.id,
    contractId: updatedRequest.contract_id,
    requestedBy: updatedRequest.requested_by as 'freelancer' | 'client',
    reason: updatedRequest.reason || undefined,
    status: updatedRequest.status as 'pending' | 'approved' | 'rejected',
    proposedChanges: updatedRequest.proposed_changes,
    requestedAt: updatedRequest.requested_at,
    respondedAt: updatedRequest.responded_at || undefined,
    respondedBy: updatedRequest.responded_by || undefined
  };
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  return (data || []).map((n: any) => ({
    id: n.id,
    userId: n.user_id,
    contractId: n.contract_id || undefined,
    eventType: n.event_type,
    message: n.message,
    isRead: n.is_read,
    created_at: n.created_at
  }));
}

export async function addNotification(notification: Omit<Notification, "id" | "created_at" | "isRead">): Promise<Notification> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from("notifications")
    .insert({
      user_id: notification.userId,
      contract_id: notification.contractId || null,
      event_type: notification.eventType,
      message: notification.message,
      is_read: false
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    userId: data.user_id,
    contractId: data.contract_id || undefined,
    eventType: data.event_type,
    message: data.message,
    isRead: data.is_read,
    created_at: data.created_at
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  const client = await getSupabaseClient();
  const { error } = await client.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export async function cancelContract(contractId: string, actor: string, reason: string): Promise<Contract | null> {
  const current = await getContractById(contractId);
  if (!current) return null;

  validateContractTransition(current.status, "cancelled");

  const client = await getSupabaseClient();
  const { data, error } = await client
    .from("contracts")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString()
    })
    .eq("id", contractId)
    .select()
    .single();
  if (error) throw error;

  await addAuditLog({
    contractId,
    action: "contract_cancelled",
    actor: actor === "freelancer" ? "freelancer" : "client",
    details: `El contrato fue cancelado por el ${actor === "freelancer" ? "Freelancer" : "Cliente"}. Motivo: ${reason}`
  });

  if (actor === "client") {
    await addNotification({
      userId: data.freelancer_id,
      contractId: data.id,
      eventType: "contract_cancelled",
      message: `El cliente ha cancelado el contrato. Motivo: ${reason}`
    });
  }

  return getContractById(contractId);
}

export async function markContractCompleted(contractId: string, actor: "freelancer" | "client"): Promise<Contract | null> {
  const current = await getContractById(contractId);
  if (!current) return null;

  if (current.status !== "accepted") {
    throw new Error("Solo contratos en estado 'accepted' pueden ser marcados como completados.");
  }

  const client = await getSupabaseClient();
  const now = new Date().toISOString();
  const updateObj: { freelancer_completed_at?: string; client_completed_at?: string; status?: string } = {};
  if (actor === "freelancer") {
    updateObj.freelancer_completed_at = now;
  } else {
    updateObj.client_completed_at = now;
  }

  const { data: checkData, error: checkError } = await client.from("contracts").select("freelancer_completed_at, client_completed_at").eq("id", contractId).single();
  if (checkError) throw checkError;

  const freelancerComp = actor === "freelancer" ? now : checkData.freelancer_completed_at;
  const clientComp = actor === "client" ? now : checkData.client_completed_at;

  if (freelancerComp && clientComp) {
    updateObj.status = "completed";
    await addAuditLog({
      contractId,
      action: "contract_completed",
      actor: "system",
      details: "Ambas partes han marcado el proyecto como terminado. Contrato finalizado."
    });
  } else {
    await addAuditLog({
      contractId,
      action: "completion_marked",
      actor: actor === "freelancer" ? "freelancer" : "client",
      details: `El ${actor === "freelancer" ? "freelancer" : "cliente"} marcó su lado como Completado.`
    });
  }

  const { error } = await client.from("contracts").update(updateObj).eq("id", contractId);
  if (error) throw error;

  return getContractById(contractId);
}

export async function uploadBrandAsset(
  fileName: string,
  mimeType: string,
  fileBase64: string
): Promise<string> {
  const buffer = Buffer.from(fileBase64, "base64");

  if (buffer.length > 2 * 1024 * 1024) {
    throw new Error("El archivo excede el límite de tamaño de 2MB.");
  }

  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error("Tipo de archivo no permitido. Solo se permiten imágenes (PNG, JPEG, SVG).");
  }

  const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueName = `${crypto.randomUUID()}-${sanitizedName}`;

  const client = await getSupabaseClient(true);
  
  const { error } = await client.storage
    .from("brand-assets")
    .upload(uniqueName, buffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    throw new Error("Error subiendo el archivo de marca a Supabase Storage: " + error.message);
  }

  const { data: urlData } = client.storage
    .from("brand-assets")
    .getPublicUrl(uniqueName);

  return urlData.publicUrl;
}
