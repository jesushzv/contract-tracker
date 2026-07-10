import * as serverActions from "./storage";
import { Contract, Milestone, Profile, ContractStatus, MilestoneStatus } from "./types";

// Helper to determine if we are in Demo Sandbox Mode (stored in browser localStorage)
const isDemoMode = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("demo_mode") === "true";
};

// Local storage keys for the browser sandbox
const KEYS = {
  PROFILE: "sandbox_profile",
  CONTRACTS: "sandbox_contracts",
  MILESTONES: "sandbox_milestones",
};

// Seed standard mock data in browser sandbox if empty
const seedSandboxIfNeeded = () => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(KEYS.PROFILE)) {
    const defaultProfile: Profile = {
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
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(defaultProfile));
  }

  if (!localStorage.getItem(KEYS.CONTRACTS)) {
    const defaultContracts: Contract[] = [
      {
        id: "c1-rediseño-marca",
        freelancerId: "demo-freelancer-uuid",
        clientName: "Alejandro Rivera (FintechMX)",
        clientEmail: "alejandro@fintechmx.co",
        clientRfc: "FMX1802058T3",
        clientRegimen: "601 - General de Ley Personas Morales",
        clientPostal: "03100",
        scopeDescription: "Rediseño completo de la identidad de marca, incluyendo logotipo, paleta de colores, tipografías y manual de identidad gráfica para la nueva plataforma digital de préstamos.",
        totalAmount: 48000,
        currency: "MXN",
        status: "accepted",
        clabe: "012180001509987654",
        bankName: "BBVA México",
        beneficiaryName: "Héctor J. Guerrero",
        acceptedAt: "2026-07-05T18:24:00Z",
        acceptedByName: "Alejandro Rivera",
        acceptedIp: "189.243.54.12",
        contractHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        created_at: "2026-07-04T12:00:00Z",
        updated_at: "2026-07-05T18:24:00Z"
      },
      {
        id: "c2-landing-page",
        freelancerId: "demo-freelancer-uuid",
        clientName: "Mariana Rosas (Studio Flora)",
        clientEmail: "contacto@studioflora.mx",
        scopeDescription: "Desarrollo de sitio web de una sola página (Landing Page) interactiva y responsiva para florería boutique con integraciones de formulario de contacto, mapa interactivo y catálogo visual en Next.js.",
        totalAmount: 18500,
        currency: "MXN",
        status: "sent",
        clabe: "012180001509987654",
        bankName: "BBVA México",
        beneficiaryName: "Héctor J. Guerrero",
        created_at: "2026-07-09T09:00:00Z",
        updated_at: "2026-07-09T09:00:00Z"
      }
    ];
    localStorage.setItem(KEYS.CONTRACTS, JSON.stringify(defaultContracts));
  }

  if (!localStorage.getItem(KEYS.MILESTONES)) {
    const defaultMilestones: Milestone[] = [
      {
        id: "m1-1",
        contractId: "c1-rediseño-marca",
        label: "Anticipo inicial (50%)",
        amount: 24000,
        dueDate: "2026-07-06",
        status: "confirmed",
        markedPaidAt: "2026-07-06T10:00:00Z",
        confirmedAt: "2026-07-06T12:30:00Z",
        created_at: "2026-07-04T12:00:00Z"
      },
      {
        id: "m1-2",
        contractId: "c1-rediseño-marca",
        label: "Presentación de propuestas y manual (50%)",
        amount: 24000,
        dueDate: "2026-07-25",
        status: "requested",
        created_at: "2026-07-04T12:00:00Z"
      },
      {
        id: "m2-1",
        contractId: "c2-landing-page",
        label: "Anticipo contra firma (40%)",
        amount: 7400,
        dueDate: "2026-07-12",
        status: "pending",
        created_at: "2026-07-09T09:00:00Z"
      },
      {
        id: "m2-2",
        contractId: "c2-landing-page",
        label: "Entrega de sitio y publicación (60%)",
        amount: 11100,
        dueDate: "2026-07-30",
        status: "pending",
        created_at: "2026-07-09T09:00:00Z"
      }
    ];
    localStorage.setItem(KEYS.MILESTONES, JSON.stringify(defaultMilestones));
  }
};

// CLIENT HANDLER: DISPATCHES TO LOCALSTORAGE IF IN DEMO, ELSE CALLS SERVER ACTIONS
export async function getProfile(): Promise<Profile> {
  if (isDemoMode()) {
    seedSandboxIfNeeded();
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : ({} as Profile);
  }
  return serverActions.getProfile();
}

export async function updateProfile(profile: Profile): Promise<Profile> {
  if (isDemoMode()) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    return profile;
  }
  return serverActions.updateProfile(profile);
}

export async function getContracts(): Promise<Contract[]> {
  if (isDemoMode()) {
    seedSandboxIfNeeded();
    const data = localStorage.getItem(KEYS.CONTRACTS);
    return data ? JSON.parse(data) : [];
  }
  return serverActions.getContracts();
}

export async function getContractById(id: string): Promise<Contract | null> {
  if (isDemoMode()) {
    const contracts = await getContracts();
    return contracts.find((c) => c.id === id) || null;
  }
  return serverActions.getContractById(id);
}

export async function saveContract(contract: Contract): Promise<Contract> {
  if (isDemoMode()) {
    const contracts = await getContracts();
    const index = contracts.findIndex((c) => c.id === contract.id);
    if (index >= 0) {
      contracts[index] = contract;
    } else {
      contracts.push(contract);
    }
    localStorage.setItem(KEYS.CONTRACTS, JSON.stringify(contracts));
    return contract;
  }
  return serverActions.saveContract(contract);
}

export async function getMilestones(contractId?: string): Promise<Milestone[]> {
  if (isDemoMode()) {
    seedSandboxIfNeeded();
    const data = localStorage.getItem(KEYS.MILESTONES);
    const allList: Milestone[] = data ? JSON.parse(data) : [];
    if (contractId) {
      return allList.filter((m) => m.contractId === contractId);
    }
    return allList;
  }
  return serverActions.getMilestones(contractId);
}

export async function saveMilestones(milestones: Milestone[]): Promise<void> {
  if (isDemoMode()) {
    const data = localStorage.getItem(KEYS.MILESTONES);
    let allList: Milestone[] = data ? JSON.parse(data) : [];
    milestones.forEach((m) => {
      const idx = allList.findIndex((item) => item.id === m.id);
      if (idx >= 0) {
        allList[idx] = m;
      } else {
        allList.push(m);
      }
    });
    localStorage.setItem(KEYS.MILESTONES, JSON.stringify(allList));
    return;
  }
  return serverActions.saveMilestones(milestones);
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: MilestoneStatus
): Promise<Milestone | null> {
  if (isDemoMode()) {
    const data = localStorage.getItem(KEYS.MILESTONES);
    if (!data) return null;
    let allList: Milestone[] = JSON.parse(data);
    const idx = allList.findIndex((m) => m.id === milestoneId);
    if (idx < 0) return null;
    
    const milestone = allList[idx];
    milestone.status = status;
    if (status === "marked_paid") {
      milestone.markedPaidAt = new Date().toISOString();
    } else if (status === "confirmed") {
      milestone.confirmedAt = new Date().toISOString();
    }
    allList[idx] = milestone;
    localStorage.setItem(KEYS.MILESTONES, JSON.stringify(allList));
    
    await checkAndUpdateContractStatus(milestone.contractId);
    return milestone;
  }
  return serverActions.updateMilestoneStatus(milestoneId, status);
}

export async function markMilestoneAsTransferred(
  milestoneId: string,
  trackingReference: string,
  transferredAmount?: number
): Promise<Milestone | null> {
  if (isDemoMode()) {
    const data = localStorage.getItem(KEYS.MILESTONES);
    if (!data) return null;
    let allList: Milestone[] = JSON.parse(data);
    const idx = allList.findIndex((m) => m.id === milestoneId);
    if (idx < 0) return null;
    
    const milestone = allList[idx];
    milestone.status = "marked_paid";
    milestone.markedPaidAt = new Date().toISOString();
    milestone.trackingReference = trackingReference;
    if (transferredAmount !== undefined) {
      milestone.transferredAmount = transferredAmount;
    }
    allList[idx] = milestone;
    localStorage.setItem(KEYS.MILESTONES, JSON.stringify(allList));
    
    await checkAndUpdateContractStatus(milestone.contractId);
    return milestone;
  }
  return serverActions.markMilestoneAsTransferred(milestoneId, trackingReference, transferredAmount);
}

export async function acceptContract(
  contractId: string,
  clientName: string
): Promise<Contract | null> {
  if (isDemoMode()) {
    const contract = await getContractById(contractId);
    if (!contract) return null;
    const milestones = await getMilestones(contractId);
    
    // In-browser mock IP since we cannot query server headers directly in sandbox
    const sandboxIp = "189.144.22.84";
    const sandboxHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("");
    
    contract.status = "accepted";
    contract.acceptedAt = new Date().toISOString();
    contract.acceptedByName = clientName;
    contract.acceptedIp = sandboxIp;
    contract.contractHash = sandboxHash;
    contract.updated_at = new Date().toISOString();
    await saveContract(contract);
    
    // Update first milestone to requested
    if (milestones.length > 0 && milestones[0].status === "pending") {
      await updateMilestoneStatus(milestones[0].id, "requested");
    }
    return contract;
  }
  return serverActions.acceptContract(contractId, clientName);
}

// Sandbox local contract checker
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
