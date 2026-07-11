"use server";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { headers } from "next/headers";
import { Contract, Milestone, Profile, MilestoneStatus } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface DbSchema {
  profile: Profile;
  contracts: Contract[];
  milestones: Milestone[];
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
      milestones: []
    };
  }
}

// Helper to write JSON file database
async function writeDb(data: DbSchema) {
  // Ensure the directory exists
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
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
  milestone.status = status;
  if (status === "marked_paid") {
    milestone.markedPaidAt = new Date().toISOString();
  } else if (status === "confirmed") {
    milestone.confirmedAt = new Date().toISOString();
  }
  
  allMilestones[idx] = milestone;
  db.milestones = allMilestones;
  await writeDb(db);
  
  // Re-calculate contract status if necessary
  await checkAndUpdateContractStatus(milestone.contractId);
  
  return milestone;
}

// SERVER ACTION: Record client transfer reference and mark milestone as paid
export async function markMilestoneAsTransferred(
  milestoneId: string,
  trackingReference: string,
  transferredAmount?: number
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
  
  allMilestones[idx] = milestone;
  db.milestones = allMilestones;
  await writeDb(db);
  
  // Re-calculate contract status if necessary
  await checkAndUpdateContractStatus(milestone.contractId);
  
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
  } else if (!allPaid && contract.status === "completed") {
    contract.status = "accepted";
    await saveContract(contract);
  }
}

// SERVER ACTION: Handle Cryptographic Signature and Client IP Detection
export async function acceptContract(
  contractId: string,
  clientName: string
): Promise<Contract | null> {
  const contract = await getContractById(contractId);
  if (!contract) return null;
  
  const milestones = await getMilestones(contractId);
  
  // 1. Resolve Server-Side IP Address from headers
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  let clientIp = "127.0.0.1";
  if (forwardedFor) {
    clientIp = forwardedFor.split(",")[0].trim();
  } else {
    clientIp = headerList.get("x-real-ip") || "127.0.0.1";
  }
  
  // 2. Generate Cryptographic SHA-256 Content Fingerprint
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
    
  // 3. Update Contract acceptance fields
  contract.status = "accepted";
  contract.acceptedAt = new Date().toISOString();
  contract.acceptedByName = clientName;
  contract.acceptedIp = clientIp;
  contract.contractHash = sha256Hash;
  contract.updated_at = new Date().toISOString();
  
  await saveContract(contract);
  
  // 4. Set first milestone (Anticipo) status to 'requested'
  if (milestones.length > 0 && milestones[0].status === "pending") {
    await updateMilestoneStatus(milestones[0].id, "requested");
  }
  
  return contract;
}
