"use server";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { headers } from "next/headers";
import { Contract, Milestone, Profile, MilestoneStatus, AuditLog, ContractVersion } from "./types";
import { sendSimulatedEmail } from "./emails";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface DbSchema {
  profile: Profile;
  contracts: Contract[];
  milestones: Milestone[];
  auditLogs?: AuditLog[];
  contractVersions?: ContractVersion[];
}

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

const localRateLimits = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(ip: string, action: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const record = localRateLimits.get(key);

  if (!record || now > record.resetAt) {
    localRateLimits.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count += 1;
  localRateLimits.set(key, record);
  return false;
}

export async function uploadReceiptFile(
  fileName: string,
  mimeType: string,
  fileBase64: string
): Promise<string> {
  const buffer = Buffer.from(fileBase64, "base64");

  // 1. File size validation (5MB)
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("El archivo excede el límite de tamaño de 5MB.");
  }

  // 2. Mimetype whitelist validation
  const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error("Tipo de archivo no permitido. Solo se permiten PDFs e imágenes (PNG, JPEG).");
  }

  // 3. Magic bytes verification
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

  // Sanitize filename to prevent path traversal
  const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueName = `${crypto.randomUUID()}-${sanitizedName}`;

  // Local storage: write to public/uploads
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, uniqueName), buffer);

  return `/uploads/${uniqueName}`;
}

// Helper to read JSON file database
async function readDb(): Promise<DbSchema> {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    // If file doesn't exist, return empty structures
    return {
      profile: {
        id: "demo-freelancer-uuid",
        email: "hector@freelancemx.dev",
        fullName: "Héctor J. Guerrero",
        rfc: "GUEH860710MX8",
        regimenFiscal: "626 - Régimen Simplificado de Confianza (RESICO)",
        codigoPostal: "06700",
        tier: "free",
        bankDetails: {
          clabe: "012180001509987654",
          bankName: "BBVA México",
          beneficiaryName: "Héctor J. Guerrero"
        }
      },
      contracts: [],
      milestones: [],
      auditLogs: []
    };
  }
}

// Helper to write JSON file database
async function writeDb(data: DbSchema) {
  // Ensure the directory exists
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// SERVER ACTIONS FOR AUDIT LOGS
export async function getAuditLogs(contractId?: string): Promise<AuditLog[]> {
  const db = await readDb();
  const logs = db.auditLogs || [];
  if (contractId) {
    return logs
      .filter((l) => l.contractId === contractId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
  return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function addAuditLog(
  log: Omit<AuditLog, "id" | "timestamp">
): Promise<AuditLog> {
  const db = await readDb();
  if (!db.auditLogs) {
    db.auditLogs = [];
  }
  const sanitizedLog = {
    ...log,
    details: sanitizeInput(log.details),
    ip: log.ip ? sanitizeInput(log.ip) : undefined,
    signature: log.signature ? sanitizeInput(log.signature) : undefined
  };
  const newLog: AuditLog = {
    ...sanitizedLog,
    id: "log-" + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.push(newLog);
  await writeDb(db);
  return newLog;
}

export async function getProfile(): Promise<Profile> {
  const db = await readDb();
  return db.profile;
}

export async function updateProfile(profile: Profile): Promise<Profile> {
  const db = await readDb();
  
  const sanitizedProfile: Profile = {
    ...profile,
    fullName: sanitizeInput(profile.fullName),
    email: sanitizeInput(profile.email),
    rfc: profile.rfc ? sanitizeInput(profile.rfc) : undefined,
    regimenFiscal: profile.regimenFiscal ? sanitizeInput(profile.regimenFiscal) : undefined,
    codigoPostal: profile.codigoPostal ? sanitizeInput(profile.codigoPostal) : undefined,
    logoUrl: profile.logoUrl ? sanitizeInput(profile.logoUrl) : undefined,
    signatureUrl: profile.signatureUrl ? sanitizeInput(profile.signatureUrl) : undefined,
    phone: profile.phone ? sanitizeInput(profile.phone) : undefined,
    bankDetails: {
      clabe: sanitizeInput(profile.bankDetails.clabe),
      bankName: sanitizeInput(profile.bankDetails.bankName),
      beneficiaryName: sanitizeInput(profile.bankDetails.beneficiaryName)
    }
  };

  db.profile = sanitizedProfile;
  await writeDb(db);
  return sanitizedProfile;
}

export async function getContracts(): Promise<Contract[]> {
  const db = await readDb();
  return db.contracts || [];
}

export async function getContractById(id: string): Promise<Contract | null> {
  const contracts = await getContracts();
  return contracts.find((c) => c.id === id) || null;
}

export async function saveContract(contract: Contract): Promise<Contract> {
  const db = await readDb();
  const contracts = db.contracts || [];
  const isNew = contracts.findIndex((c: Contract) => c.id === contract.id) < 0;

  if (!contract.clientAccessToken) {
    contract.clientAccessToken = crypto.randomUUID();
  }

  const sanitizedContract: Contract = {
    ...contract,
    clientName: sanitizeInput(contract.clientName),
    clientEmail: sanitizeInput(contract.clientEmail),
    clientRfc: contract.clientRfc ? sanitizeInput(contract.clientRfc) : undefined,
    clientRegimen: contract.clientRegimen ? sanitizeInput(contract.clientRegimen) : undefined,
    clientPostal: contract.clientPostal ? sanitizeInput(contract.clientPostal) : undefined,
    clientPhone: contract.clientPhone ? sanitizeInput(contract.clientPhone) : undefined,
    scopeDescription: sanitizeInput(contract.scopeDescription),
    clabe: contract.clabe ? sanitizeInput(contract.clabe) : undefined,
    bankName: contract.bankName ? sanitizeInput(contract.bankName) : undefined,
    beneficiaryName: contract.beneficiaryName ? sanitizeInput(contract.beneficiaryName) : undefined,
    freelancerRfc: contract.freelancerRfc ? sanitizeInput(contract.freelancerRfc) : undefined,
    freelancerRegimen: contract.freelancerRegimen ? sanitizeInput(contract.freelancerRegimen) : undefined,
    freelancerPostal: contract.freelancerPostal ? sanitizeInput(contract.freelancerPostal) : undefined,
    acceptedByName: contract.acceptedByName ? sanitizeInput(contract.acceptedByName) : undefined,
    acceptedIp: contract.acceptedIp ? sanitizeInput(contract.acceptedIp) : undefined,
    freelancerAcceptedByName: contract.freelancerAcceptedByName ? sanitizeInput(contract.freelancerAcceptedByName) : undefined,
    freelancerAcceptedIp: contract.freelancerAcceptedIp ? sanitizeInput(contract.freelancerAcceptedIp) : undefined,
    clientAccessToken: contract.clientAccessToken
  };

  // Snap freelancer's current fiscal info into the contract if not set
  if (!sanitizedContract.freelancerRfc || !sanitizedContract.freelancerRegimen) {
    sanitizedContract.freelancerRfc = sanitizeInput(db.profile.rfc);
    sanitizedContract.freelancerRegimen = sanitizeInput(db.profile.regimenFiscal);
    sanitizedContract.freelancerPostal = sanitizeInput(db.profile.codigoPostal);
  }

  const index = contracts.findIndex((c: Contract) => c.id === sanitizedContract.id);
  if (index >= 0) {
    const oldContract = contracts[index];
    const hasChanges = oldContract.scopeDescription !== sanitizedContract.scopeDescription ||
                       oldContract.totalAmount !== sanitizedContract.totalAmount ||
                       oldContract.currency !== sanitizedContract.currency;
    if (hasChanges) {
      if (!db.contractVersions) {
        db.contractVersions = [];
      }
      const versions = db.contractVersions.filter(v => v.contractId === oldContract.id);
      const nextVer = versions.length > 0 ? Math.max(...versions.map(v => v.versionNumber)) + 1 : 1;
      
      const newVersion: ContractVersion = {
        id: "ver-" + Math.random().toString(36).substring(2, 9),
        contractId: oldContract.id,
        versionNumber: nextVer,
        scopeDescription: oldContract.scopeDescription,
        totalAmount: oldContract.totalAmount,
        currency: oldContract.currency,
        taxWithholdingAmount: oldContract.taxWithholdingAmount,
        ivaAmount: oldContract.ivaAmount,
        subtotalAmount: oldContract.subtotalAmount,
        modifiedAt: new Date().toISOString(),
        reason: oldContract.status === "draft" ? "Reversión a borrador" : "Modificación de propuesta"
      };
      db.contractVersions.push(newVersion);
    }
    contracts[index] = sanitizedContract;
  } else {
    contracts.push(sanitizedContract);
  }
  
  db.contracts = contracts;
  await writeDb(db);

  if (isNew) {
    await addAuditLog({
      contractId: sanitizedContract.id,
      action: "created",
      actor: "freelancer",
      details: `El contrato para "${sanitizedContract.clientName}" fue creado y guardado como borrador.`
    });
  }

  if (sanitizedContract.status === "sent") {
    const tokenPart = sanitizedContract.clientAccessToken ? `?token=${sanitizedContract.clientAccessToken}` : "";
    const clientUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${sanitizedContract.id}${tokenPart}`;
    sendSimulatedEmail({
      to: sanitizedContract.clientEmail,
      subject: `Propuesta de Contrato de Servicios Profesionales - ${sanitizedContract.clientName}`,
      html: `<p>Hola ${sanitizedContract.clientName},</p><p>Te han compartido una propuesta de contrato por ${sanitizedContract.totalAmount} ${sanitizedContract.currency}.</p><p>Puedes revisarlo y firmar aquí: <a href="${clientUrl}">${clientUrl}</a></p>`
    }).catch(console.error);
  }

  return sanitizedContract;
}

export async function getMilestones(contractId?: string): Promise<Milestone[]> {
  const db = await readDb();
  const allMilestones: Milestone[] = db.milestones || [];
  if (contractId) {
    return allMilestones.filter((m) => m.contractId === contractId);
  }
  return allMilestones;
}

export async function saveMilestones(milestones: Milestone[]): Promise<void> {
  const db = await readDb();
  const allMilestones: Milestone[] = db.milestones || [];
  
  milestones.forEach((m) => {
    const idx = allMilestones.findIndex((item) => item.id === m.id);
    if (idx >= 0) {
      allMilestones[idx] = m;
    } else {
      allMilestones.push(m);
    }
  });
  
  db.milestones = allMilestones;
  await writeDb(db);
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneStatus
): Promise<Milestone | null> {
  const db = await readDb();
  const allMilestones: Milestone[] = db.milestones || [];
  const idx = allMilestones.findIndex((m) => m.id === milestoneId);
  if (idx < 0) return null;
  
  const milestone = allMilestones[idx];
  const oldStatus = milestone.status;
  milestone.status = status;
  
  if (status === "marked_paid") {
    milestone.markedPaidAt = new Date().toISOString();
    milestone.confirmedAt = undefined;
  } else if (status === "confirmed") {
    milestone.confirmedAt = new Date().toISOString();
  } else if (status === "pending" || status === "requested") {
    milestone.markedPaidAt = undefined;
    milestone.confirmedAt = undefined;
    milestone.trackingReference = undefined;
    milestone.transferredAmount = undefined;
    milestone.receiptUrl = undefined;
  }
  
  allMilestones[idx] = milestone;
  db.milestones = allMilestones;
  await writeDb(db);
  
  // Re-calculate contract status if necessary
  await checkAndUpdateContractStatus(milestone.contractId);
  
  // Log milestone events
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
      const contract = db.contracts?.find(c => c.id === milestone.contractId);
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
      const contract = db.contracts?.find(c => c.id === milestone.contractId);
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

// SERVER ACTION: Record client transfer reference and mark milestone as paid
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

  const db = await readDb();
  const allMilestones: Milestone[] = db.milestones || [];
  const idx = allMilestones.findIndex((m) => m.id === milestoneId);
  if (idx < 0) return null;
  
  const milestone = allMilestones[idx];
  milestone.status = "marked_paid";
  milestone.markedPaidAt = new Date().toISOString();
  milestone.trackingReference = sanitizeInput(trackingReference);
  if (transferredAmount !== undefined) {
    milestone.transferredAmount = transferredAmount;
  }
  if (receiptUrl !== undefined) {
    milestone.receiptUrl = sanitizeInput(receiptUrl);
  }
  if (exchangeRate !== undefined) {
    milestone.exchangeRate = exchangeRate;
  }
  if (mxnAmount !== undefined) {
    milestone.mxnAmount = mxnAmount;
  }
  
  // Trigger automatic CEP mock reconciliation
  const cleanRef = trackingReference.toUpperCase().trim();
  const isRejected = cleanRef.includes("REJECT") || cleanRef.includes("INVALID") || cleanRef.length < 5;
  if (!isRejected) {
    milestone.status = "confirmed";
    milestone.confirmedAt = new Date().toISOString();
  }

  allMilestones[idx] = milestone;
  db.milestones = allMilestones;
  await writeDb(db);
  
  // Re-calculate contract status if necessary
  await checkAndUpdateContractStatus(milestone.contractId);
  
  // Log client transfer
  if (!isRejected) {
    await addAuditLog({
      contractId: milestone.contractId,
      action: "milestone_confirmed",
      actor: "system",
      details: `Reconciliación automática SPEI: CEP validado con éxito. Clave de rastreo: ${trackingReference}. Banco Emisor: BBVA México, Beneficiario: CLABE terminada en ${db.profile.bankDetails.clabe.slice(-4)}. Estado: LIQUIDADO.`
    });
  } else {
    await addAuditLog({
      contractId: milestone.contractId,
      action: "milestone_transferred",
      actor: "client",
      details: `Fallo de reconciliación automática CEP: Clave de rastreo ${trackingReference} no encontrada o rechazada en Banco de México.`
    });
  }

  // Send email to freelancer
  const profile = db.profile;
  const freelancerEmail = profile?.email || "hector@freelancemx.dev";
  sendSimulatedEmail({
    to: freelancerEmail,
    subject: `Pago Reportado: Hito "${milestone.label}"`,
    html: `<p>Hola,</p><p>El cliente ha reportado la transferencia para el hito <strong>"${milestone.label}"</strong> por un monto de <strong>$${milestone.amount}</strong>.</p><p>Clave de rastreo: <strong>${trackingReference}</strong>.</p><p>Por favor, ingresa al panel para verificar y confirmarlo de conformidad.</p>`
  }).catch(console.error);

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
    contract.status = "completed";
    await saveContract(contract);
    
    await addAuditLog({
      contractId: contract.id,
      action: "milestone_confirmed",
      actor: "system",
      details: "Todos los hitos han sido pagados. Contrato marcado como Completado."
    });
  } else if (!allPaid && contract.status === "completed") {
    contract.status = "accepted";
    await saveContract(contract);

    await addAuditLog({
      contractId: contract.id,
      action: "milestone_requested",
      actor: "system",
      details: "Un hito fue revertido. Contrato reactivado como Sellado."
    });
  }
}

export async function generateClientOtp(contractId: string): Promise<string | null> {
  const ip = await getClientIp();
  // Limit to 5 OTP generations per 15 minutes per IP
  const isLimited = await checkRateLimit(ip, "otp_generate", 5, 15 * 60 * 1000);
  if (isLimited) {
    throw new Error("Límite de solicitudes de OTP superado. Por favor, intente más tarde.");
  }

  const db = await readDb();
  const contracts = db.contracts || [];
  const idx = contracts.findIndex(c => c.id === contractId);
  if (idx < 0) return null;
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  contracts[idx].clientOtpCode = otpCode;
  contracts[idx].clientOtpAttempts = 0; // Reset attempts on new OTP generation
  db.contracts = contracts;
  await writeDb(db);
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

  const db = await readDb();
  const contracts = db.contracts || [];
  const idx = contracts.findIndex(c => c.id === contractId);
  if (idx < 0) return null;
  const contract = contracts[idx];

  // OTP attempts lockout guard
  const attempts = contract.clientOtpAttempts || 0;
  if (attempts >= 3) {
    throw new Error("El código de verificación ha sido bloqueado por seguridad debido a demasiados intentos fallidos. Solicite un nuevo código.");
  }

  if (!contract.clientOtpCode || contract.clientOtpCode !== otpCode) {
    contract.clientOtpAttempts = attempts + 1;
    db.contracts = contracts;
    await writeDb(db);

    if (contract.clientOtpAttempts >= 3) {
      throw new Error("Código incorrecto. La verificación ha sido bloqueada debido a demasiados intentos fallidos. Solicite un nuevo código.");
    }
    throw new Error("El código de verificación ingresado es incorrecto.");
  }
  
  const milestones = await getMilestones(contractId);
  
  // Resolve Server-Side IP Address from headers
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  let clientIp = "127.0.0.1";
  if (forwardedFor) {
    clientIp = forwardedFor.split(",")[0].trim();
  } else {
    clientIp = headerList.get("x-real-ip") || "127.0.0.1";
  }
  
  // Generate Cryptographic SHA-256 Client-Side Signature Fingerprint
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
    
  // Update Contract status and client acceptance signatures
  contract.status = "client_signed";
  contract.acceptedAt = new Date().toISOString();
  contract.acceptedByName = sanitizeInput(clientName);
  contract.acceptedIp = clientIp;
  contract.contractHash = sha256Hash;
  contract.clientOtpCode = undefined;
  contract.clientOtpVerified = true;
  contract.clientOtpAttempts = 0; // Reset attempts on success
  contract.updated_at = new Date().toISOString();
  
  // Save updated contracts array in memory db
  contracts[idx] = contract;
  db.contracts = contracts;
  await writeDb(db);
  
  // Write audit log entry
  await addAuditLog({
    contractId: contract.id,
    action: "client_signed",
    actor: "client",
    details: `El cliente ${contract.acceptedByName} firmó el contrato digitalmente (Verificado con OTP).`,
    ip: clientIp,
    signature: sha256Hash
  });

  // Send simulated email to freelancer
  const profile = db.profile;
  const freelancerEmail = profile?.email || "hector@freelancemx.dev";
  sendSimulatedEmail({
    to: freelancerEmail,
    subject: `Contrato Firmado por el Cliente - ${contract.clientName}`,
    html: `<p>Hola,</p><p>El cliente <strong>${contract.clientName}</strong> ha firmado el contrato digitalmente.</p><p>Por favor, ingresa al panel de control para revisarlo y realizar la firma de conformidad final.</p>`
  }).catch(console.error);
  
  return contract;
}

// FREELANCER VETS & COUNTERSIGNS CONTRACT (moves to 'accepted' and locks)
export async function vetAndAcceptContract(
  contractId: string,
  freelancerName: string
): Promise<Contract | null> {
  const contract = await getContractById(contractId);
  if (!contract) return null;
  
  const milestones = await getMilestones(contractId);
  
  // Resolve Server-Side IP Address from headers
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  let freelancerIp = "127.0.0.1";
  if (forwardedFor) {
    freelancerIp = forwardedFor.split(",")[0].trim();
  } else {
    freelancerIp = headerList.get("x-real-ip") || "127.0.0.1";
  }

  // Generate Final Cryptographic SHA-256 Double-Signature Seal
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

  // Update status to fully active/accepted and record freelancer signature info
  contract.status = "accepted";
  contract.freelancerAcceptedAt = new Date().toISOString();
  contract.freelancerAcceptedByName = freelancerName;
  contract.freelancerAcceptedIp = freelancerIp;
  contract.contractHash = finalHash;
  contract.updated_at = new Date().toISOString();
  
  await saveContract(contract);

  // Write audit log entry
  await addAuditLog({
    contractId: contract.id,
    action: "freelancer_accepted",
    actor: "freelancer",
    details: `El freelancer ${freelancerName} verificó y aprobó el contrato. Documento sellado y activo.`,
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

  // Automatically request the first milestone (e.g. Anticipo)
  if (milestones.length > 0 && milestones[0].status === "pending") {
    await updateMilestoneStatus(milestones[0].id, "requested");
  }

  return contract;
}

export async function proposeContractRevision(
  contractId: string,
  reason: string
): Promise<Contract | null> {
  const db = await readDb();
  const contracts = db.contracts || [];
  const idx = contracts.findIndex((c) => c.id === contractId);
  if (idx < 0) return null;

  const contract = contracts[idx];
  contract.status = "draft";
  contract.acceptedAt = undefined;
  contract.acceptedByName = undefined;
  contract.acceptedIp = undefined;
  contract.freelancerAcceptedAt = undefined;
  contract.freelancerAcceptedByName = undefined;
  contract.freelancerAcceptedIp = undefined;
  contract.contractHash = undefined;
  contract.clientOtpVerified = false;
  contract.clientOtpCode = undefined;
  contract.updated_at = new Date().toISOString();

  contracts[idx] = contract;
  await writeDb(db);

  await addAuditLog({
    contractId: contractId,
    action: "revision_proposed",
    actor: "system",
    details: `Se solicitó revisión del contrato. Motivo: ${reason}`
  });

  // Send email notifications to both parties
  const tokenPart = contract.clientAccessToken ? `?token=${contract.clientAccessToken}` : "";
  const clientUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${contract.id}${tokenPart}`;
  const profile = db.profile;
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

  return contract;
}

export async function getContractVersions(contractId: string): Promise<ContractVersion[]> {
  const db = await readDb();
  const versions = db.contractVersions || [];
  return versions
    .filter((v) => v.contractId === contractId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

export async function saveContractVersion(
  version: Omit<ContractVersion, "id" | "modifiedAt">
): Promise<ContractVersion> {
  const db = await readDb();
  if (!db.contractVersions) {
    db.contractVersions = [];
  }
  const versions = db.contractVersions.filter(v => v.contractId === version.contractId);
  const nextVer = versions.length > 0 ? Math.max(...versions.map(v => v.versionNumber)) + 1 : 1;

  const newVersion: ContractVersion = {
    id: "ver-" + Math.random().toString(36).substring(2, 9),
    contractId: version.contractId,
    versionNumber: nextVer,
    scopeDescription: sanitizeInput(version.scopeDescription),
    totalAmount: version.totalAmount,
    currency: version.currency,
    taxWithholdingAmount: version.taxWithholdingAmount,
    ivaAmount: version.ivaAmount,
    subtotalAmount: version.subtotalAmount,
    modifiedAt: new Date().toISOString(),
    reason: version.reason ? sanitizeInput(version.reason) : undefined
  };

  db.contractVersions.push(newVersion);
  await writeDb(db);
  return newVersion;
}
