import * as localActions from "./storage";
import * as supabaseActions from "./storageSupabase";
import { Contract, Milestone, Profile, MilestoneStatus, AuditLog } from "./types";

// Determine if we should use the cloud Supabase database
const shouldUseSupabase = (): boolean => {
  // If running in a Vercel Staging/Preview environment, we bypass the cloud DB
  // to avoid persistent data storage or requiring a secondary DB.
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
    return false;
  }
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== "";
};

// Dispatch server actions based on config
const serverActions = shouldUseSupabase() ? supabaseActions : localActions;

// Helper to determine if we are in Demo Sandbox Mode (stored in browser localStorage)
const isDemoMode = (): boolean => {
  if (typeof window === "undefined") return false;
  
  // Force sandbox/localStorage mode by default in Vercel Staging/Preview deployments
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
    return true;
  }
  
  return localStorage.getItem("demo_mode") === "true";
};

// Local storage keys for the browser sandbox
const KEYS = {
  PROFILE: "sandbox_profile",
  CONTRACTS: "sandbox_contracts",
  MILESTONES: "sandbox_milestones",
  AUDIT_LOGS: "sandbox_audit_logs"
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
        freelancerAcceptedAt: "2026-07-05T18:25:00Z",
        freelancerAcceptedByName: "Héctor J. Guerrero",
        freelancerAcceptedIp: "189.243.54.10",
        contractHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        created_at: "2026-07-04T12:00:00Z",
        updated_at: "2026-07-05T18:25:00Z"
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
      },
      {
        id: "c3-consultoria-resico",
        freelancerId: "demo-freelancer-uuid",
        clientName: "Carlos Martínez (Asesores S.C.)",
        clientEmail: "carlos@asesores.mx",
        scopeDescription: "Servicio de asesoría fiscal mensual y optimización para la transición al Régimen Simplificado de Confianza (RESICO).",
        totalAmount: 15000,
        currency: "MXN",
        status: "completed",
        clabe: "012180001509987654",
        bankName: "BBVA México",
        beneficiaryName: "Héctor J. Guerrero",
        acceptedAt: "2026-06-14T10:00:00Z",
        acceptedByName: "Carlos Martínez",
        acceptedIp: "201.166.45.10",
        freelancerAcceptedAt: "2026-06-14T10:05:00Z",
        freelancerAcceptedByName: "Héctor J. Guerrero",
        freelancerAcceptedIp: "201.166.45.12",
        contractHash: "6c5edf7f90f23028cd97818e698fb924a7ee41e4649b934ca495991b7852b861",
        created_at: "2026-06-12T14:00:00Z",
        updated_at: "2026-06-14T10:05:00Z"
      },
      {
        id: "c4-desarrollo-ecommerce",
        freelancerId: "demo-freelancer-uuid",
        clientName: "Roberto Sánchez (E-Shop Mx)",
        clientEmail: "roberto@eshop.mx",
        scopeDescription: "Desarrollo de plataforma E-commerce con panel de administración autoadministrable, carrito de compras, catálogo dinámico e integración de pasarela de pagos en Next.js y Tailwind CSS.",
        totalAmount: 90000,
        currency: "MXN",
        status: "accepted",
        clabe: "012180001509987654",
        bankName: "BBVA México",
        beneficiaryName: "Héctor J. Guerrero",
        acceptedAt: "2026-06-25T11:00:00Z",
        acceptedByName: "Roberto Sánchez",
        acceptedIp: "187.143.52.99",
        freelancerAcceptedAt: "2026-06-25T11:10:00Z",
        freelancerAcceptedByName: "Héctor J. Guerrero",
        freelancerAcceptedIp: "187.143.52.10",
        contractHash: "9e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b810",
        created_at: "2026-06-24T08:00:00Z",
        updated_at: "2026-06-25T11:10:00Z"
      },
      {
        id: "c5-draft-contrato",
        freelancerId: "demo-freelancer-uuid",
        clientName: "Valeria Gómez (Muebles de Madera)",
        clientEmail: "valeria@mueblesmadera.mx",
        scopeDescription: "Diseño y modelado 3D para catálogo interactivo de la línea de muebles para oficina corporativa 2026.",
        totalAmount: 22000,
        currency: "MXN",
        status: "draft",
        clabe: "012180001509987654",
        bankName: "BBVA México",
        beneficiaryName: "Héctor J. Guerrero",
        created_at: "2026-07-09T17:00:00Z",
        updated_at: "2026-07-09T17:00:00Z"
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
      },
      {
        id: "m3-1",
        contractId: "c3-consultoria-resico",
        label: "Pago único de honorarios (100%)",
        amount: 15000,
        dueDate: "2026-06-15",
        status: "confirmed",
        markedPaidAt: "2026-06-15T09:00:00Z",
        confirmedAt: "2026-06-15T11:00:00Z",
        created_at: "2026-06-12T14:00:00Z"
      },
      {
        id: "m4-1",
        contractId: "c4-desarrollo-ecommerce",
        label: "Anticipo contra inicio (30%)",
        amount: 27000,
        dueDate: "2026-06-26",
        status: "confirmed",
        markedPaidAt: "2026-06-26T10:00:00Z",
        confirmedAt: "2026-06-26T12:00:00Z",
        created_at: "2026-06-24T08:00:00Z"
      },
      {
        id: "m4-2",
        contractId: "c4-desarrollo-ecommerce",
        label: "Entrega de versión Beta funcional (40%)",
        amount: 36000,
        dueDate: "2026-07-09", // Overdue yesterday
        status: "requested",
        created_at: "2026-06-24T08:00:00Z"
      },
      {
        id: "m4-3",
        contractId: "c4-desarrollo-ecommerce",
        label: "Despliegue a producción y finiquito (30%)",
        amount: 27000,
        dueDate: "2026-07-28",
        status: "pending",
        created_at: "2026-06-24T08:00:00Z"
      },
      {
        id: "m5-1",
        contractId: "c5-draft-contrato",
        label: "Anticipo inicial (50%)",
        amount: 11000,
        dueDate: "2026-07-15",
        status: "pending",
        created_at: "2026-07-09T17:00:00Z"
      },
      {
        id: "m5-2",
        contractId: "c5-draft-contrato",
        label: "Entrega y finiquito (50%)",
        amount: 11000,
        dueDate: "2026-07-31",
        status: "pending",
        created_at: "2026-07-09T17:00:00Z"
      }
    ];
    localStorage.setItem(KEYS.MILESTONES, JSON.stringify(defaultMilestones));
  }

  if (!localStorage.getItem(KEYS.AUDIT_LOGS)) {
    const defaultAuditLogs: AuditLog[] = [
      {
        id: "l1",
        contractId: "c1-rediseño-marca",
        action: "created",
        actor: "freelancer",
        details: "El contrato para \"Alejandro Rivera (FintechMX)\" fue creado y guardado como borrador.",
        timestamp: "2026-07-04T12:00:00Z"
      },
      {
        id: "l2",
        contractId: "c1-rediseño-marca",
        action: "client_signed",
        actor: "client",
        details: "El cliente Alejandro Rivera firmó el contrato digitalmente.",
        timestamp: "2026-07-05T18:24:00Z",
        ip: "189.243.54.12",
        signature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      {
        id: "l3",
        contractId: "c1-rediseño-marca",
        action: "freelancer_accepted",
        actor: "freelancer",
        details: "El freelancer Héctor J. Guerrero verificó y aprobó el contrato. Documento sellado y activo.",
        timestamp: "2026-07-05T18:25:00Z",
        ip: "189.243.54.10",
        signature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      {
        id: "l4",
        contractId: "c1-rediseño-marca",
        action: "milestone_confirmed",
        actor: "freelancer",
        details: "Pago confirmado y recibido para el hito: \"Anticipo inicial (50%)\".",
        timestamp: "2026-07-06T12:30:00Z"
      }
    ];
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(defaultAuditLogs));
  }
};

// CLIENT HANDLER: DISPATCHES TO LOCALSTORAGE IF IN DEMO, ELSE CALLS ACTIVE SERVER ACTIONS
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
    const isNew = index < 0;

    if (index >= 0) {
      contracts[index] = contract;
    } else {
      contracts.push(contract);
    }
    localStorage.setItem(KEYS.CONTRACTS, JSON.stringify(contracts));

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
    const allList: Milestone[] = data ? JSON.parse(data) : [];
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
    const allList: Milestone[] = JSON.parse(data);
    const idx = allList.findIndex((m) => m.id === milestoneId);
    if (idx < 0) return null;
    
    const milestone = allList[idx];
    const oldStatus = milestone.status;
    milestone.status = status;
    if (status === "marked_paid") {
      milestone.markedPaidAt = new Date().toISOString();
    } else if (status === "confirmed") {
      milestone.confirmedAt = new Date().toISOString();
    }
    allList[idx] = milestone;
    localStorage.setItem(KEYS.MILESTONES, JSON.stringify(allList));
    
    await checkAndUpdateContractStatus(milestone.contractId);

    // Log milestone changes
    if (status !== oldStatus) {
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
    const allList: Milestone[] = JSON.parse(data);
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

    await addAuditLog({
      contractId: milestone.contractId,
      action: "milestone_transferred",
      actor: "client",
      details: `El cliente reportó transferencia para "${milestone.label}" (Monto: $${transferredAmount || milestone.amount}, Ref: ${trackingReference}).`
    });

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
    
    const sandboxIp = "189.144.22.84";
    const sandboxHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("");
    
    contract.status = "client_signed";
    contract.acceptedAt = new Date().toISOString();
    contract.acceptedByName = clientName;
    contract.acceptedIp = sandboxIp;
    contract.contractHash = sandboxHash;
    contract.updated_at = new Date().toISOString();
    await saveContract(contract);

    await addAuditLog({
      contractId: contract.id,
      action: "client_signed",
      actor: "client",
      details: `El cliente ${clientName} firmó el contrato digitalmente.`,
      ip: sandboxIp,
      signature: sandboxHash
    });
    
    return contract;
  }
  return serverActions.acceptContract(contractId, clientName);
}

export async function vetAndAcceptContract(
  contractId: string,
  freelancerName: string
): Promise<Contract | null> {
  if (isDemoMode()) {
    const contract = await getContractById(contractId);
    if (!contract) return null;
    const milestones = await getMilestones(contractId);

    const sandboxIp = "189.144.22.84";
    const sandboxHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("");

    contract.status = "accepted";
    contract.freelancerAcceptedAt = new Date().toISOString();
    contract.freelancerAcceptedByName = freelancerName;
    contract.freelancerAcceptedIp = sandboxIp;
    contract.contractHash = sandboxHash;
    contract.updated_at = new Date().toISOString();
    await saveContract(contract);

    await addAuditLog({
      contractId: contract.id,
      action: "freelancer_accepted",
      actor: "freelancer",
      details: `El freelancer ${freelancerName} verificó y aprobó el contrato. Documento sellado y activo.`,
      ip: sandboxIp,
      signature: sandboxHash
    });

    if (milestones.length > 0 && milestones[0].status === "pending") {
      await updateMilestoneStatus(milestones[0].id, "requested");
    }
    return contract;
  }
  return serverActions.vetAndAcceptContract(contractId, freelancerName);
}

export async function getAuditLogs(contractId?: string): Promise<AuditLog[]> {
  if (isDemoMode()) {
    seedSandboxIfNeeded();
    const data = localStorage.getItem(KEYS.AUDIT_LOGS);
    const logs: AuditLog[] = data ? JSON.parse(data) : [];
    if (contractId) {
      return logs
        .filter((l) => l.contractId === contractId)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
  return serverActions.getAuditLogs(contractId);
}

export async function addAuditLog(
  log: Omit<AuditLog, "id" | "timestamp">
): Promise<AuditLog> {
  if (isDemoMode()) {
    seedSandboxIfNeeded();
    const data = localStorage.getItem(KEYS.AUDIT_LOGS);
    const logs: AuditLog[] = data ? JSON.parse(data) : [];
    const newLog: AuditLog = {
      ...log,
      id: "log-" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    logs.push(newLog);
    localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(logs));
    return newLog;
  }
  return serverActions.addAuditLog(log);
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
    await addAuditLog({
      contractId: contractId,
      action: "milestone_confirmed",
      actor: "system",
      details: "Todos los hitos han sido liquidados. Contrato marcado como Completado."
    });
  } else if (!allPaid && contract.status === "completed") {
    contract.status = "accepted";
    await saveContract(contract);
  }
}
