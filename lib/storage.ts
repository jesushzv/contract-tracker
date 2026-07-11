"use server";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { headers } from "next/headers";
import { Contract, Milestone, Profile, MilestoneStatus, AuditLog } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface DbSchema {
  profile: Profile;
  contracts: Contract[];
  milestones: Milestone[];
  auditLogs?: AuditLog[];
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
        rfc: "GUEH860710MX3",
        regimenFiscal: "626 - Régimen Simplificado de Confianza (RESICO)",
        codigoPostal: "06700",
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
  const newLog: AuditLog = {
    ...log,
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
  db.profile = profile;
  await writeDb(db);
  return profile;
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

  // Snap freelancer's current fiscal info into the contract if not set
  if (!contract.freelancerRfc || !contract.freelancerRegimen) {
    contract.freelancerRfc = db.profile.rfc;
    contract.freelancerRegimen = db.profile.regimenFiscal;
    contract.freelancerPostal = db.profile.codigoPostal;
  }

  const index = contracts.findIndex((c: Contract) => c.id === contract.id);
  if (index >= 0) {
    contracts[index] = contract;
  } else {
    contracts.push(contract);
  }
  
  db.contracts = contracts;
  await writeDb(db);

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
  const db = await readDb();
  const allMilestones: Milestone[] = db.milestones || [];
  const idx = allMilestones.findIndex((m) => m.id === milestoneId);
  if (idx < 0) return null;
  
  const milestone = allMilestones[idx];
  milestone.status = "marked_paid";
  milestone.markedPaidAt = new Date().toISOString();
  milestone.trackingReference = trackingReference;
  if (transferredAmount !== undefined) {
    milestone.transferredAmount = transferredAmount;
  }
  if (receiptUrl !== undefined) {
    milestone.receiptUrl = receiptUrl;
  }
  
  allMilestones[idx] = milestone;
  db.milestones = allMilestones;
  await writeDb(db);
  
  // Re-calculate contract status if necessary
  await checkAndUpdateContractStatus(milestone.contractId);
  
  // Log client transfer
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

// CLIENT PORTAL: Client accepts & signs contract (moves to 'client_signed')
export async function acceptContract(
  contractId: string,
  clientName: string
): Promise<Contract | null> {
  const contract = await getContractById(contractId);
  if (!contract) return null;
  
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
  contract.acceptedByName = clientName;
  contract.acceptedIp = clientIp;
  contract.contractHash = sha256Hash;
  contract.updated_at = new Date().toISOString();
  
  await saveContract(contract);

  // Write audit log entry
  await addAuditLog({
    contractId: contract.id,
    action: "client_signed",
    actor: "client",
    details: `El cliente ${clientName} firmó el contrato digitalmente.`,
    ip: clientIp,
    signature: sha256Hash
  });
  
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

  // Automatically request the first milestone (e.g. Anticipo)
  if (milestones.length > 0 && milestones[0].status === "pending") {
    await updateMilestoneStatus(milestones[0].id, "requested");
  }

  return contract;
}
