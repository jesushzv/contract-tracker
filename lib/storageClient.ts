import * as localActions from "./storage";
import * as supabaseActions from "./storageSupabase";
import { Contract, Milestone, Profile, ContractStatus, MilestoneStatus, AuditLog, ContractVersion, PaymentProfile, EditRequest, Notification } from "./types";

// Determine if we should use the cloud Supabase database
export const shouldUseSupabase = (): boolean => {
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
export const isDemoMode = (): boolean => {
  if (typeof window === "undefined") return false;
  
  // Force sandbox/localStorage mode by default in Vercel Staging/Preview deployments
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
    return true;
  }
  
  const hasDemoParam = new URLSearchParams(window.location.search).get("demo") === "true";
  if (hasDemoParam) {
    localStorage.setItem("demo_mode", "true");
    return true;
  }
  
  const hasDemoCookie = document.cookie.split("; ").some(row => row.trim().startsWith("demo_mode=true"));
  return localStorage.getItem("demo_mode") === "true" || hasDemoCookie;
};

// Local storage keys for the browser sandbox
const KEYS = {
  PROFILE: "sandbox_profile",
  CONTRACTS: "sandbox_contracts",
  MILESTONES: "sandbox_milestones",
  AUDIT_LOGS: "sandbox_audit_logs",
  CONTRACT_VERSIONS: "sandbox_contract_versions"
};

// Seed standard mock data in browser sandbox if empty
const seedSandboxIfNeeded = () => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(KEYS.PROFILE)) {
    const defaultProfile: Profile = {
      id: "demo-freelancer-uuid",
      email: "hector@freelancemx.dev",
      fullName: "Héctor J. Guerrero",
      rfc: "GUEH860710MX8",
      regimenFiscal: "626 - Régimen Simplificado de Confianza (RESICO)",
      codigoPostal: "06700",
      tier: "pro",
      bankDetails: {
        clabe: "012180001509987654",
        bankName: "BBVA México",
        beneficiaryName: "Héctor J. Guerrero"
      }
    };
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(defaultProfile));
  } else {
    try {
      const prof = JSON.parse(localStorage.getItem(KEYS.PROFILE) || "{}");
      if (!prof.tier || prof.tier === "free") {
        prof.tier = "pro";
        localStorage.setItem(KEYS.PROFILE, JSON.stringify(prof));
      }
    } catch {}
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
    if (!data) return [];
    const list: Contract[] = JSON.parse(data);
    let updated = false;
    list.forEach(c => {
      if (!c.clientAccessToken) {
        c.clientAccessToken = `token-${c.id}`;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(KEYS.CONTRACTS, JSON.stringify(list));
    }
    return list;
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
  if (!contract.clientAccessToken) {
    const uuid = typeof window !== 'undefined' && window.crypto?.randomUUID ? window.crypto.randomUUID() : Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join("");
    contract.clientAccessToken = uuid;
  }

  if (isDemoMode()) {
    const contracts = await getContracts();
    const index = contracts.findIndex((c) => c.id === contract.id);
    const isNew = index < 0;

    if (index >= 0) {
      const oldContract = contracts[index];
      const hasChanges = oldContract.scopeDescription !== contract.scopeDescription ||
                         oldContract.totalAmount !== contract.totalAmount ||
                         oldContract.currency !== contract.currency;
      if (hasChanges) {
        const verData = localStorage.getItem(KEYS.CONTRACT_VERSIONS);
        const verList: ContractVersion[] = verData ? JSON.parse(verData) : [];
        const versions = verList.filter(v => v.contractId === oldContract.id);
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
        verList.push(newVersion);
        localStorage.setItem(KEYS.CONTRACT_VERSIONS, JSON.stringify(verList));
      }
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

    const statusOrder = ['pending', 'requested', 'marked_paid', 'confirmed'];
    const isRevert = statusOrder.indexOf(status) < statusOrder.indexOf(oldStatus);

    if (!isRevert) {
      if (status === "confirmed" && oldStatus !== "marked_paid") {
        throw new Error("El hito debe haber sido reportado como transferido por el cliente antes de ser confirmado.");
      }
      if (status === "marked_paid" && oldStatus !== "requested") {
        throw new Error("Un hito solo puede ser marcado como transferido si ha sido solicitado previamente.");
      }
    }

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
    
    allList[idx] = milestone;
    localStorage.setItem(KEYS.MILESTONES, JSON.stringify(allList));
    
    await checkAndUpdateContractStatus(milestone.contractId);

    // Log milestone changes
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
  return serverActions.updateMilestoneStatus(milestoneId, status);
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
  if (isDemoMode()) {
    const data = localStorage.getItem(KEYS.MILESTONES);
    if (!data) return null;
    const allList: Milestone[] = JSON.parse(data);
    const idx = allList.findIndex((m) => m.id === milestoneId);
    if (idx < 0) return null;
    
    const milestone = allList[idx];
    const oldStatus = milestone.status;
    if (oldStatus !== "requested") {
      throw new Error("El hito debe estar en estado 'Solicitado' antes de que el cliente lo marque como transferido.");
    }

    const cleanRef = trackingReference.toUpperCase().trim();
    const isRejected = cleanRef.includes("REJECT") || cleanRef.includes("INVALID") || cleanRef.length < 5;
    const targetStatus = !isRejected ? "confirmed" : "marked_paid";

    milestone.status = targetStatus;
    milestone.markedPaidAt = new Date().toISOString();
    milestone.trackingReference = trackingReference;
    if (transferredAmount !== undefined) {
      milestone.transferredAmount = transferredAmount;
    }
    if (receiptUrl !== undefined) {
      milestone.receiptUrl = receiptUrl;
    }
    if (exchangeRate !== undefined) {
      milestone.exchangeRate = exchangeRate;
    }
    if (mxnAmount !== undefined) {
      milestone.mxnAmount = mxnAmount;
    }
    if (!isRejected) {
      milestone.confirmedAt = new Date().toISOString();
    }
    allList[idx] = milestone;
    localStorage.setItem(KEYS.MILESTONES, JSON.stringify(allList));
    
    await checkAndUpdateContractStatus(milestone.contractId);

    const profData = localStorage.getItem(KEYS.PROFILE);
    const profile: Profile | null = profData ? JSON.parse(profData) : null;
    const lastDigits = profile?.bankDetails?.clabe ? profile.bankDetails.clabe.slice(-4) : "8765";

    if (!isRejected) {
      await addAuditLog({
        contractId: milestone.contractId,
        action: "milestone_confirmed",
        actor: "system",
        details: `Reconciliación automática SPEI: CEP validado con éxito. Clave de rastreo: ${trackingReference}. Banco Emisor: BBVA México, Beneficiario: CLABE terminada en ${lastDigits}. Estado: LIQUIDADO.`
      });
    } else {
      await addAuditLog({
        contractId: milestone.contractId,
        action: "milestone_transferred",
        actor: "client",
        details: `Fallo de reconciliación automática CEP: Clave de rastreo ${trackingReference} no encontrada o rechazada en Banco de México.`
      });
    }

    return milestone;
  }
  return serverActions.markMilestoneAsTransferred(milestoneId, trackingReference, transferredAmount, receiptUrl, exchangeRate, mxnAmount);
}

export async function generateClientOtp(contractId: string): Promise<string | null> {
  if (isDemoMode()) {
    const contract = await getContractById(contractId);
    if (!contract) return null;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    contract.clientOtpCode = otpCode;
    await saveContract(contract);
    return otpCode;
  }
  return serverActions.generateClientOtp(contractId);
}

export async function acceptContract(
  contractId: string,
  clientName: string,
  otpCode: string
): Promise<Contract | null> {
  if (isDemoMode()) {
    const contract = await getContractById(contractId);
    if (!contract) return null;

    if (contract.status !== "sent") {
      throw new Error("Solo se pueden firmar contratos en estado 'Enviado'.");
    }

    if (!contract.clientOtpCode || contract.clientOtpCode !== otpCode) {
      throw new Error("El código de verificación ingresado es incorrecto.");
    }

    const clientIp = "127.0.0.1";
    const sha256Hash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("");

    contract.status = "client_signed";
    contract.acceptedAt = new Date().toISOString();
    contract.acceptedByName = clientName;
    contract.acceptedIp = clientIp;
    contract.contractHash = sha256Hash;
    contract.clientOtpVerified = true;
    contract.clientOtpCode = undefined;
    contract.updated_at = new Date().toISOString();

    await saveContract(contract);

    await addAuditLog({
      contractId: contract.id,
      action: "client_signed",
      actor: "client",
      details: `El cliente ${clientName} firmó el contrato digitalmente (Verificado con OTP).`,
      ip: clientIp,
      signature: sha256Hash
    });

    return contract;
  }
  return serverActions.acceptContract(contractId, clientName, otpCode);
}

export async function vetAndAcceptContract(
  contractId: string,
  freelancerName: string
): Promise<Contract | null> {
  if (isDemoMode()) {
    const contract = await getContractById(contractId);
    if (!contract) return null;

    if (contract.status !== "client_signed") {
      throw new Error("El contrato debe estar firmado por el cliente para poder validarlo y contra-firmarlo.");
    }

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

export async function proposeContractRevision(
  contractId: string,
  reason: string
): Promise<Contract | null> {
  if (isDemoMode()) {
    const contract = await getContractById(contractId);
    if (!contract) return null;

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

    await saveContract(contract);

    await addAuditLog({
      contractId: contractId,
      action: "revision_proposed",
      actor: "system",
      details: `Se solicitó revisión del contrato. Motivo: ${reason}`
    });

    return contract;
  }
  return serverActions.proposeContractRevision(contractId, reason);
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
    await addAuditLog({
      contractId: contract.id,
      action: "milestone_requested",
      actor: "system",
      details: "Un hito fue revertido. Contrato reactivado como Sellado."
    });
  }
}

export async function loadSampleData(): Promise<boolean> {
  if (isDemoMode()) {
    seedSandboxIfNeeded();
    return true;
  }
  if (shouldUseSupabase()) {
    return supabaseActions.loadSampleData();
  }
  return false;
}

export async function getContractVersions(contractId: string): Promise<ContractVersion[]> {
  if (isDemoMode()) {
    const data = localStorage.getItem(KEYS.CONTRACT_VERSIONS);
    const list: ContractVersion[] = data ? JSON.parse(data) : [];
    return list
      .filter((v) => v.contractId === contractId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }
  return serverActions.getContractVersions(contractId);
}

export async function saveContractVersion(
  version: Omit<ContractVersion, "id" | "modifiedAt">
): Promise<ContractVersion> {
  if (isDemoMode()) {
    const verData = localStorage.getItem(KEYS.CONTRACT_VERSIONS);
    const verList: ContractVersion[] = verData ? JSON.parse(verData) : [];
    const versions = verList.filter(v => v.contractId === version.contractId);
    const nextVer = versions.length > 0 ? Math.max(...versions.map(v => v.versionNumber)) + 1 : 1;

    const newVersion: ContractVersion = {
      id: "ver-" + Math.random().toString(36).substring(2, 9),
      contractId: version.contractId,
      versionNumber: nextVer,
      scopeDescription: version.scopeDescription,
      totalAmount: version.totalAmount,
      currency: version.currency,
      taxWithholdingAmount: version.taxWithholdingAmount,
      ivaAmount: version.ivaAmount,
      subtotalAmount: version.subtotalAmount,
      modifiedAt: new Date().toISOString(),
      reason: version.reason || undefined
    };
    verList.push(newVersion);
    localStorage.setItem(KEYS.CONTRACT_VERSIONS, JSON.stringify(verList));
    return newVersion;
  }
  return serverActions.saveContractVersion(version);
}

export async function uploadReceiptFile(
  fileName: string,
  mimeType: string,
  fileBase64: string
): Promise<string> {
  if (isDemoMode()) {
    const buffer = Buffer.from(fileBase64, "base64");
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error("El archivo excede el límite de tamaño de 5MB.");
    }
    const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error("Tipo de archivo no permitido. Solo se permiten PDFs e imágenes (PNG, JPEG).");
    }
    
    const hex = buffer.toString("hex", 0, 8).toUpperCase();
    let isValidMagic = false;
    if (mimeType === "application/pdf" && hex.startsWith("25504446")) isValidMagic = true;
    else if (mimeType === "image/png" && hex.startsWith("89504E470D0A1A0A")) isValidMagic = true;
    else if ((mimeType === "image/jpeg" || mimeType === "image/jpg") && hex.startsWith("FFD8FF")) isValidMagic = true;

    if (!isValidMagic) {
      throw new Error("Firma de archivo inválida. El contenido del archivo no coincide con su extensión.");
    }

    return `https://demo-mode-receipts.local/${fileName}`;
  }
  return serverActions.uploadReceiptFile(fileName, mimeType, fileBase64);
}

export async function getPaymentProfiles(freelancerId?: string): Promise<PaymentProfile[]> {
  if (isDemoMode()) {
    const data = localStorage.getItem("sandbox_payment_profiles");
    const list: PaymentProfile[] = data ? JSON.parse(data) : [];
    if (freelancerId) {
      return list.filter((p) => p.freelancerId === freelancerId);
    }
    return list;
  }
  return serverActions.getPaymentProfiles(freelancerId);
}

export async function savePaymentProfile(profile: PaymentProfile): Promise<PaymentProfile> {
  if (isDemoMode()) {
    const data = localStorage.getItem("sandbox_payment_profiles");
    const list: PaymentProfile[] = data ? JSON.parse(data) : [];
    
    if (profile.isDefault) {
      list.forEach(p => {
        if (p.freelancerId === profile.freelancerId) p.isDefault = false;
      });
    }

    const idx = list.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      list[idx] = profile;
    } else {
      list.push(profile);
    }
    localStorage.setItem("sandbox_payment_profiles", JSON.stringify(list));
    return profile;
  }
  return serverActions.savePaymentProfile(profile);
}

export async function deletePaymentProfile(id: string): Promise<void> {
  if (isDemoMode()) {
    const data = localStorage.getItem("sandbox_payment_profiles");
    let list: PaymentProfile[] = data ? JSON.parse(data) : [];
    list = list.filter(p => p.id !== id);
    localStorage.setItem("sandbox_payment_profiles", JSON.stringify(list));
    return;
  }
  return serverActions.deletePaymentProfile(id);
}

export async function getEditRequests(contractId: string): Promise<EditRequest[]> {
  if (isDemoMode()) {
    const data = localStorage.getItem("sandbox_edit_requests");
    const list: EditRequest[] = data ? JSON.parse(data) : [];
    return list.filter(r => r.contractId === contractId);
  }
  return serverActions.getEditRequests(contractId);
}

export async function proposeEditRequest(editRequest: Omit<EditRequest, "id" | "requestedAt" | "status">): Promise<EditRequest> {
  if (isDemoMode()) {
    const data = localStorage.getItem("sandbox_edit_requests");
    const list: EditRequest[] = data ? JSON.parse(data) : [];
    const newRequest: EditRequest = {
      ...editRequest,
      id: "req-" + Math.random().toString(36).substring(2, 9),
      status: "pending",
      requestedAt: new Date().toISOString()
    };
    list.push(newRequest);
    localStorage.setItem("sandbox_edit_requests", JSON.stringify(list));

    const contract = await getContractById(editRequest.contractId);
    if (contract && editRequest.requestedBy === "client") {
      await addNotification({
        userId: contract.freelancerId,
        contractId: contract.id,
        eventType: "edit_requested",
        message: `El cliente ${contract.clientName} ha propuesto una modificación al contrato.`
      });
    }

    return newRequest;
  }
  return serverActions.proposeEditRequest(editRequest);
}

export async function respondToEditRequest(id: string, status: "approved" | "rejected", respondedBy: string): Promise<EditRequest | null> {
  if (isDemoMode()) {
    const data = localStorage.getItem("sandbox_edit_requests");
    const list: EditRequest[] = data ? JSON.parse(data) : [];
    const idx = list.findIndex(r => r.id === id);
    if (idx < 0) return null;

    const request = list[idx];
    request.status = status;
    request.respondedAt = new Date().toISOString();
    request.respondedBy = respondedBy;
    list[idx] = request;
    localStorage.setItem("sandbox_edit_requests", JSON.stringify(list));

    if (status === "approved") {
      const contract = await getContractById(request.contractId);
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

        const changes = request.proposedChanges;
        const updated = {
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
        await saveContract(updated);

        if (changes.milestones) {
          const mData = localStorage.getItem(KEYS.MILESTONES);
          let mList: Milestone[] = mData ? JSON.parse(mData) : [];
          mList = mList.filter(m => m.contractId !== contract.id);
          changes.milestones.forEach((m: Omit<Milestone, 'created_at'>) => {
            mList.push({
              ...m,
              created_at: new Date().toISOString()
            });
          });
          localStorage.setItem(KEYS.MILESTONES, JSON.stringify(mList));
        }

        await addAuditLog({
          contractId: contract.id,
          action: "edit_approved",
          actor: request.requestedBy === "freelancer" ? "client" : "freelancer",
          details: `Modificación de contrato aprobada. El acuerdo se revirtió a Borrador para nueva firma.`
        });
      }
    } else {
      await addAuditLog({
        contractId: request.contractId,
        action: "edit_rejected",
        actor: request.requestedBy === "freelancer" ? "client" : "freelancer",
        details: `Modificación de contrato rechazada por ${respondedBy}.`
      });
    }

    const contractObj = await getContractById(request.contractId);
    if (contractObj && request.requestedBy === "freelancer") {
      await addNotification({
        userId: contractObj.freelancerId,
        contractId: contractObj.id,
        eventType: "edit_responded",
        message: `El cliente ha ${status === "approved" ? "aprobado" : "rechazado"} los cambios propuestos al contrato.`
      });
    }

    return request;
  }
  return serverActions.respondToEditRequest(id, status, respondedBy);
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  if (isDemoMode()) {
    const data = localStorage.getItem("sandbox_notifications");
    const list: Notification[] = data ? JSON.parse(data) : [];
    return list
      .filter(n => n.userId === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return serverActions.getNotifications(userId);
}

export async function addNotification(notification: Omit<Notification, "id" | "created_at" | "isRead">): Promise<Notification> {
  if (isDemoMode()) {
    const data = localStorage.getItem("sandbox_notifications");
    const list: Notification[] = data ? JSON.parse(data) : [];
    const newNotification: Notification = {
      ...notification,
      id: "notif-" + Math.random().toString(36).substring(2, 9),
      isRead: false,
      created_at: new Date().toISOString()
    };
    list.push(newNotification);
    localStorage.setItem("sandbox_notifications", JSON.stringify(list));
    return newNotification;
  }
  return serverActions.addNotification(notification);
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isDemoMode()) {
    const data = localStorage.getItem("sandbox_notifications");
    const list: Notification[] = data ? JSON.parse(data) : [];
    const idx = list.findIndex(n => n.id === id);
    if (idx >= 0) {
      list[idx].isRead = true;
      localStorage.setItem("sandbox_notifications", JSON.stringify(list));
    }
    return;
  }
  return serverActions.markNotificationRead(id);
}

export async function cancelContract(contractId: string, actor: string, reason: string): Promise<Contract | null> {
  if (isDemoMode()) {
    const contract = await getContractById(contractId);
    if (!contract) return null;
    contract.status = "cancelled";
    contract.updated_at = new Date().toISOString();
    await saveContract(contract);

    await addAuditLog({
      contractId,
      action: "contract_cancelled",
      actor: actor === "freelancer" ? "freelancer" : "client",
      details: `El contrato fue cancelado por el ${actor === "freelancer" ? "Freelancer" : "Cliente"}. Motivo: ${reason}`
    });

    if (actor === "client") {
      await addNotification({
        userId: contract.freelancerId,
        contractId: contract.id,
        eventType: "contract_cancelled",
        message: `El cliente ha cancelado el contrato. Motivo: ${reason}`
      });
    }

    return contract;
  }
  return serverActions.cancelContract(contractId, actor, reason);
}

export async function markContractCompleted(contractId: string, actor: "freelancer" | "client"): Promise<Contract | null> {
  if (isDemoMode()) {
    const contract = await getContractById(contractId);
    if (!contract) return null;
    const now = new Date().toISOString();

    if (actor === "freelancer") {
      contract.freelancerCompletedAt = now;
    } else {
      contract.clientCompletedAt = now;
    }

    if (contract.freelancerCompletedAt && contract.clientCompletedAt) {
      contract.status = "completed";
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

    await saveContract(contract);
    return contract;
  }
  return serverActions.markContractCompleted(contractId, actor);
}

export async function uploadBrandAsset(
  fileName: string,
  mimeType: string,
  fileBase64: string
): Promise<string> {
  if (isDemoMode()) {
    const buffer = Buffer.from(fileBase64, "base64");
    if (buffer.length > 2 * 1024 * 1024) {
      throw new Error("El archivo excede el límite de tamaño de 2MB.");
    }
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error("Tipo de archivo no permitido. Solo se permiten imágenes (PNG, JPEG, SVG).");
    }
    return `https://demo-mode-brand-assets.local/${fileName}`;
  }
  return serverActions.uploadBrandAsset(fileName, mimeType, fileBase64);
}
