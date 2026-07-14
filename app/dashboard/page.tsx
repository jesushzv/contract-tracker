"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Send, 
  Copy, 
  MessageCircle, 
  CreditCard, 
  AlertCircle, 
  Eye, 
  Settings, 
  ExternalLink, 
  ShieldCheck, 
  Briefcase, 
  RotateCcw,
  BarChart3,
  Printer
} from "lucide-react";
import { 
  getContracts, 
  getMilestones, 
  getProfile, 
  updateProfile, 
  saveContract, 
  saveMilestones,
  updateMilestoneStatus,
  getAuditLogs,
  vetAndAcceptContract,
  addAuditLog,
  loadSampleData,
  getContractVersions,
  cancelContract,
  markContractCompleted,
  getPaymentProfiles,
  savePaymentProfile,
  deletePaymentProfile,
  uploadBrandAsset,
  markMilestoneAsTransferred,
  uploadReceiptFile
} from "@/lib/storageClient";
import { Contract, Milestone, Profile, AuditLog, ContractVersion, PaymentProfile } from "@/lib/types";
import { MOCK_CLAUSES } from "@/lib/mockData";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedContractLogs, setSelectedContractLogs] = useState<AuditLog[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'client_signed' | 'accepted' | 'completed' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [allMilestones, setAllMilestones] = useState<Milestone[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [editScopeDescription, setEditScopeDescription] = useState("");
  const [editTotalAmount, setEditTotalAmount] = useState(0);
  const [editMilestones, setEditMilestones] = useState<Milestone[]>([]);
  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editClientRfc, setEditClientRfc] = useState("");
  const [editClientRegimen, setEditClientRegimen] = useState("");
  const [editClientPostal, setEditClientPostal] = useState("");
  const [editCurrency, setEditCurrency] = useState<'MXN' | 'USD'>("MXN");
  const [editRetencionIsr, setEditRetencionIsr] = useState(false);
  const [editRetencionIva, setEditRetencionIva] = useState(false);
  const [editSelectedClauses, setEditSelectedClauses] = useState<string[]>([]);


  const [fullName, setFullName] = useState("");
  const [clabe, setClabe] = useState("");
  const [bankName, setBankName] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [rfc, setRfc] = useState("");
  const [regimenFiscal, setRegimenFiscal] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [phone, setPhone] = useState("");
  const [contractVersions, setContractVersions] = useState<ContractVersion[]>([]);

  // Cancellation & Double-Completion Flow States
  const [isCancellingContract, setIsCancellingContract] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Payment Profiles CRUD States
  const [paymentProfiles, setPaymentProfiles] = useState<PaymentProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<PaymentProfile | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(true);
  const [profileNickname, setProfileNickname] = useState("");
  const [profileBankName, setProfileBankName] = useState("");
  const [profileClabe, setProfileClabe] = useState("");
  const [profileInstructions, setProfileInstructions] = useState("");

  // Upload/Error banner states
  const [uploadError, setUploadError] = useState("");

  // Freelancer Payment Proof States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMilestone, setPaymentMilestone] = useState<Milestone | null>(null);
  const [trackingReference, setTrackingReference] = useState("");
  const [transferredAmount, setTransferredAmount] = useState<number>(0);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptFileType, setReceiptFileType] = useState<'file' | 'url'>('file');
  const [receiptFileBase64, setReceiptFileBase64] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [receiptFileMimeType, setReceiptFileMimeType] = useState("");
  const [overrideExchangeRate, setOverrideExchangeRate] = useState("20.15");
  const [modalError, setModalError] = useState("");
  const [loading, setLoading] = useState(false);

  // Warning/Confirmation Modal State
  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => Promise<void>) | null;
    isError?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isError: false
  });


  useEffect(() => {
    async function loadInitialData() {
      let demoActive = false;
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("demo") === "true") {
          localStorage.setItem("demo_mode", "true");
          window.history.replaceState({}, document.title, window.location.pathname);
          demoActive = true;
        } else {
          demoActive = localStorage.getItem("demo_mode") === "true";
        }
        setIsDemo(demoActive);
      }

      const prof = await getProfile();
      setProfile(prof);
      setFullName(prof.fullName);
      setClabe(prof.bankDetails.clabe);
      setBankName(prof.bankDetails.bankName);
      setBeneficiaryName(prof.bankDetails.beneficiaryName);
      setRfc(prof.rfc || "");
      setRegimenFiscal(prof.regimenFiscal || "");
      setCodigoPostal(prof.codigoPostal || "");
      setLogoUrl(prof.logoUrl || "");
      setSignatureUrl(prof.signatureUrl || "");
      setPhone(prof.phone || "");

      // Load payment profiles
      try {
        const profilesList = await getPaymentProfiles(prof.id);
        setPaymentProfiles(profilesList);
      } catch (err) {
        console.error("Error loading payment profiles:", err);
      }

      const allContracts = await getContracts();
      setContracts(allContracts);
      const allMData = await getMilestones();
      setAllMilestones(allMData);
      if (allContracts.length > 0) {
        setSelectedContract(allContracts[0]);
        const mList = allMData.filter(m => m.contractId === allContracts[0].id);
        setMilestones(mList);
        const logs = await getAuditLogs(allContracts[0].id);
        setSelectedContractLogs(logs);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadLogsAndVersions() {
      if (selectedContract) {
        const logs = await getAuditLogs(selectedContract.id);
        setSelectedContractLogs(logs);
        const versions = await getContractVersions(selectedContract.id);
        setContractVersions(versions);
      } else {
        setSelectedContractLogs([]);
        setContractVersions([]);
      }
    }
    loadLogsAndVersions();
  }, [selectedContract]);

  const refreshData = async () => {
    const allContracts = await getContracts();
    setContracts(allContracts);
    const allMData = await getMilestones();
    setAllMilestones(allMData);
    if (selectedContract) {
      const updated = allContracts.find(c => c.id === selectedContract.id) || null;
      setSelectedContract(updated);
      if (updated) {
        const mList = allMData.filter(m => m.contractId === updated.id);
        setMilestones(mList);
        const logs = await getAuditLogs(updated.id);
        setSelectedContractLogs(logs);
      }
    }
  };

  const handleSelectContract = async (contract: Contract) => {
    setSelectedContract(contract);
    const mList = await getMilestones(contract.id);
    setMilestones(mList);
    const logs = await getAuditLogs(contract.id);
    setSelectedContractLogs(logs);
  };

  const handleUpdateMilestone = async (milestoneId: string, newStatus: 'pending' | 'requested' | 'marked_paid' | 'confirmed') => {
    const milestone = allMilestones.find(m => m.id === milestoneId);
    const currentStatus = milestone ? milestone.status : 'pending';
    const statusOrder = ['pending', 'requested', 'marked_paid', 'confirmed'];
    const isRevert = statusOrder.indexOf(newStatus) < statusOrder.indexOf(currentStatus);

    const executeUpdate = async () => {
      try {
        await updateMilestoneStatus(milestoneId, newStatus);
        await refreshData();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setWarningModal({
          isOpen: true,
          title: "Error de Transición",
          message: `No se pudo actualizar el hito: ${msg}`,
          onConfirm: null,
          isError: true
        });
      }
    };

    if (isRevert) {
      setWarningModal({
        isOpen: true,
        title: "Revertir Estado de Hito",
        message: `¿Estás seguro de que deseas revertir el estado del hito "${milestone?.label || ''}" de "${currentStatus}" a "${newStatus}"? Esto podría alterar el flujo del contrato.`,
        onConfirm: executeUpdate,
        isError: false
      });
    } else {
      await executeUpdate();
    }
  };

  const handleOpenPaymentModal = (milestone: Milestone) => {
    setPaymentMilestone(milestone);
    setTrackingReference("");
    setTransferredAmount(milestone.amount);
    setReceiptUrl("");
    setReceiptFileType("file");
    setReceiptFileBase64("");
    setReceiptFileName("");
    setReceiptFileMimeType("");
    setModalError("");
    setOverrideExchangeRate("20.15");
    setShowPaymentModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptFileBase64("");
      setReceiptFileName("");
      setReceiptFileMimeType("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setModalError("El archivo excede el límite de tamaño de 5MB.");
      return;
    }

    const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedMimeTypes.includes(file.type)) {
      setModalError("Solo se permiten archivos PDF o imágenes (PNG, JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setReceiptFileBase64(base64Data);
      setReceiptFileName(file.name);
      setReceiptFileMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleMarkAsTransferred = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMilestone || !trackingReference || !selectedContract) return;

    setLoading(true);
    setModalError("");
    try {
      let resolvedReceiptUrl = undefined;
      if (receiptFileType === 'file') {
        if (!receiptFileBase64) {
          throw new Error("Por favor, seleccione un archivo de comprobante de pago.");
        }
        resolvedReceiptUrl = await uploadReceiptFile(
          receiptFileName,
          receiptFileMimeType,
          receiptFileBase64
        );
      } else {
        resolvedReceiptUrl = receiptUrl || undefined;
      }

      const fxRate = parseFloat(overrideExchangeRate) || 20.15;
      const mxnSum = selectedContract.currency === "USD" ? (transferredAmount * fxRate) : undefined;

      await markMilestoneAsTransferred(
        paymentMilestone.id,
        trackingReference,
        transferredAmount,
        resolvedReceiptUrl,
        selectedContract.currency === "USD" ? fxRate : undefined,
        mxnSum
      );
      await refreshData();
      setShowPaymentModal(false);
      setPaymentMilestone(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar referencia de transferencia.";
      setModalError(msg);
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateContractStatus = async (newStatus: Contract['status']) => {
    if (!selectedContract) return;
    const updated: Contract = {
      ...selectedContract,
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    await saveContract(updated);
    await refreshData();
  };

  const handleVetAndCounterSign = async () => {
    if (!selectedContract) return;

    const executeVet = async () => {
      try {
        const updated = await vetAndAcceptContract(selectedContract.id, profile?.fullName || "Héctor J. Guerrero");
        if (updated) {
          await refreshData();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setWarningModal({
          isOpen: true,
          title: "Error al Contra-firmar",
          message: `No se pudo contra-firmar y sellar el contrato: ${msg}`,
          onConfirm: null,
          isError: true
        });
      }
    };

    setWarningModal({
      isOpen: true,
      title: "Contra-firmar y Sellar Contrato",
      message: "¿Estás seguro de que deseas contra-firmar y sellar este contrato? Esto formalizará legalmente el acuerdo bajo los términos actuales y no podrá editarse.",
      onConfirm: executeVet,
      isError: false
    });
  };


  const handleEditTotalAmountChange = (newTotal: number) => {
    setEditTotalAmount(newTotal);
    setEditMilestones(prev => {
      if (prev.length === 0) return prev;
      const oldSum = prev.reduce((sum, m) => sum + m.amount, 0) || 1;
      const scaleFactor = newTotal / oldSum;
      let runningSum = 0;
      return prev.map((m, idx) => {
        const isLast = idx === prev.length - 1;
        let newAmt = Math.round(m.amount * scaleFactor);
        if (isLast) {
          newAmt = newTotal - runningSum;
        } else {
          runningSum += newAmt;
        }
        return { ...m, amount: newAmt };
      });
    });
  };

  const handleEditMilestoneAmount = (idx: number, newAmt: number) => {
    setEditMilestones(prev => {
      const updated = prev.map((m, i) => i === idx ? { ...m, amount: newAmt } : m);
      const newSum = updated.reduce((sum, m) => sum + m.amount, 0);
      setEditTotalAmount(newSum);
      return updated;
    });
  };

  const handleEditAddMilestone = () => {
    setEditMilestones(prev => [
      ...prev,
      {
        id: "new-" + Math.random().toString(36).substring(2, 9),
        contractId: selectedContract?.id || "",
        label: "",
        amount: 0,
        dueDate: new Date(Date.now() + (prev.length + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]);
  };

  const handleEditRemoveMilestone = (idx: number) => {
    if (editMilestones.length <= 1) return;
    setEditMilestones(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      const newSum = updated.reduce((sum, m) => sum + m.amount, 0);
      setEditTotalAmount(newSum);
      return updated;
    });
  };

  const handleCancelContract = async () => {
    if (!selectedContract || !cancelReason.trim()) return;

    const executeCancel = async () => {
      try {
        await cancelContract(selectedContract.id, "freelancer", cancelReason);
        setIsCancellingContract(false);
        setCancelReason("");
        await refreshData();
      } catch (err) {
        const error = err as Error;
        setWarningModal({
          isOpen: true,
          title: "Error al Cancelar Contrato",
          message: `No se pudo cancelar el contrato: ${error.message}`,
          onConfirm: null,
          isError: true
        });
      }
    };

    setWarningModal({
      isOpen: true,
      title: "Cancelar Contrato",
      message: "¿Estás seguro de que deseas cancelar este contrato? Esta acción es irreversible y anulará todos los hitos pendientes.",
      onConfirm: executeCancel,
      isError: false
    });
  };

  const handleMarkCompleted = async () => {
    if (!selectedContract) return;

    const executeComplete = async () => {
      try {
        await markContractCompleted(selectedContract.id, "freelancer");
        await refreshData();
      } catch (err) {
        const error = err as Error;
        setWarningModal({
          isOpen: true,
          title: "Error al Completar Contrato",
          message: `No se pudo marcar el contrato como completado: ${error.message}`,
          onConfirm: null,
          isError: true
        });
      }
    };

    setWarningModal({
      isOpen: true,
      title: "Completar Contrato",
      message: "¿Estás seguro de que deseas marcar este contrato como completado? Esto finalizará la relación comercial bajo este acuerdo.",
      onConfirm: executeComplete,
      isError: false
    });
  };


  const handleBrandFileUpload = async (file: File | undefined, type: "logo" | "signature") => {
    if (!file) return;
    setUploadError("");
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("El archivo excede el límite de tamaño de 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const uploadedUrl = await uploadBrandAsset(file.name, file.type, base64);
        if (type === "logo") {
          setLogoUrl(uploadedUrl);
        } else {
          setSignatureUrl(uploadedUrl);
        }
      } catch (err) {
        const error = err as Error;
        setUploadError("Error al subir archivo: " + error.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const newProfile = {
        id: editingProfile?.id || "pp-" + Math.random().toString(36).substring(2, 9),
        freelancerId: profile.id,
        nickname: profileNickname,
        bankName: profileBankName,
        clabe: profileClabe,
        paymentInstructions: profileInstructions || undefined,
        isDefault: editingProfile ? editingProfile.isDefault : paymentProfiles.length === 0,
      };
      await savePaymentProfile(newProfile);
      
      // Refresh list
      const profilesList = await getPaymentProfiles(profile.id);
      setPaymentProfiles(profilesList);
      
      // Reset form
      setEditingProfile(null);
      setProfileNickname("");
      setProfileBankName("");
      setProfileClabe("");
      setProfileInstructions("");
      setShowProfileForm(false);
    } catch (err) {
      const error = err as Error;
      alert("Error al guardar perfil de pago: " + error.message);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!profile || !confirm("¿Seguro que deseas eliminar este perfil de pago?")) return;
    try {
      await deletePaymentProfile(id);
      const profilesList = await getPaymentProfiles(profile.id);
      setPaymentProfiles(profilesList);
    } catch (err) {
      const error = err as Error;
      alert("Error al eliminar perfil de pago: " + error.message);
    }
  };

  const handleSetDefaultProfile = async (id: string) => {
    if (!profile) return;
    try {
      const updated = paymentProfiles.map(p => ({
        ...p,
        isDefault: p.id === id
      }));
      for (const p of updated) {
        await savePaymentProfile(p);
      }
      const profilesList = await getPaymentProfiles(profile.id);
      setPaymentProfiles(profilesList);
    } catch (err) {
      const error = err as Error;
      alert("Error al establecer perfil por defecto: " + error.message);
    }
  };
  const startEditingContract = () => {
    if (!selectedContract) return;
    setEditScopeDescription(selectedContract.scopeDescription);
    setEditTotalAmount(selectedContract.totalAmount);
    setEditMilestones(milestones.map(m => ({ ...m })));
    setEditClientName(selectedContract.clientName);
    setEditClientEmail(selectedContract.clientEmail);
    setEditClientPhone(selectedContract.clientPhone || "");
    setEditClientRfc(selectedContract.clientRfc || "");
    setEditClientRegimen(selectedContract.clientRegimen || "");
    setEditClientPostal(selectedContract.clientPostal || "");
    setEditCurrency(selectedContract.currency);
    setEditRetencionIsr(!!selectedContract.retencionIsr);
    setEditRetencionIva(!!selectedContract.retencionIva);
    setEditSelectedClauses(selectedContract.selectedClauses || []);
    setIsEditingContract(true);
  };

  const handleSaveModification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    // Validate milestone sums
    const milestoneSum = editMilestones.reduce((sum, m) => sum + m.amount, 0);
    if (Math.abs(milestoneSum - editTotalAmount) > 0.01) {
      alert(`La suma de los hitos (${milestoneSum} ${editCurrency}) debe ser exactamente igual al monto total del contrato (${editTotalAmount} ${editCurrency}). Por favor, ajusta los importes de tus hitos.`);
      return;
    }

    const executeSaveModification = async () => {
      try {
        const total = editTotalAmount;
        const subtotalAmount = total;
        const taxWithholdingAmount = (editRetencionIsr ? total * 0.10 : 0) + (editRetencionIva ? total * 0.16 * (2 / 3) : 0);
        const ivaAmount = total * 0.16;

        const updatedContract: Contract = {
          ...selectedContract,
          clientName: editClientName,
          clientEmail: editClientEmail,
          clientPhone: editClientPhone || undefined,
          clientRfc: editClientRfc || undefined,
          clientRegimen: editClientRegimen || undefined,
          clientPostal: editClientPostal || undefined,
          scopeDescription: editScopeDescription,
          totalAmount: total,
          currency: editCurrency,
          retencionIsr: editRetencionIsr,
          retencionIva: editRetencionIva,
          taxWithholdingAmount,
          ivaAmount,
          subtotalAmount,
          selectedClauses: editSelectedClauses,
          status: 'sent',
          acceptedAt: undefined,
          acceptedByName: undefined,
          acceptedIp: undefined,
          freelancerAcceptedAt: undefined,
          freelancerAcceptedByName: undefined,
          freelancerAcceptedIp: undefined,
          contractHash: undefined
        };

        // Ensure newly added milestones have cryptographically secure UUIDs
        const finalMilestones = editMilestones.map((m) => {
          const finalId = m.id.startsWith("new-") ? (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          })) : m.id;
          return {
            ...m,
            id: finalId,
            contractId: selectedContract.id
          };
        });

        await saveContract(updatedContract);
        await saveMilestones(finalMilestones);

        await addAuditLog({
          contractId: selectedContract.id,
          action: 'modified',
          actor: 'freelancer',
          details: `El freelancer modificó los componentes del contrato (Nuevo monto: ${editTotalAmount} ${editCurrency}). El acuerdo regresó a estado Enviado.`,
          ip: '127.0.0.1'
        });

        setIsEditingContract(false);
        await refreshData();
        alert("Propuesta modificada con éxito. El estado se ha restablecido a 'Enviado' para la aceptación y firma del cliente.");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setWarningModal({
          isOpen: true,
          title: "Error al Modificar Propuesta",
          message: `No se pudieron guardar las modificaciones: ${msg}`,
          onConfirm: null,
          isError: true
        });
      }
    };

    setWarningModal({
      isOpen: true,
      title: "Guardar Modificaciones",
      message: "¿Estás seguro de que deseas guardar estas modificaciones? El contrato se restablecerá a estado 'Enviado' y requerirá la firma del cliente nuevamente.",
      onConfirm: executeSaveModification,
      isError: false
    });
  };


  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updatedProfile: Profile = {
      ...profile,
      fullName,
      rfc: rfc || undefined,
      regimenFiscal: regimenFiscal || undefined,
      codigoPostal: codigoPostal || undefined,
      logoUrl: logoUrl || undefined,
      signatureUrl: signatureUrl || undefined,
      phone: phone || undefined,
      bankDetails: {
        clabe,
        bankName,
        beneficiaryName
      }
    };

    try {
      await updateProfile(updatedProfile);
      setProfile(updatedProfile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Error al guardar perfil: " + err);
    }
  };

  const handleExportAuditLog = () => {
    if (!selectedContract) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor, permite las ventanas emergentes para exportar el registro de auditoría.");
      return;
    }

    const logRows = selectedContractLogs
      .map(
        (log) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(log.timestamp).toLocaleString("es-MX")}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${log.actor.toUpperCase()}</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${log.details}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace;">${log.ip || "N/A"}</td>
      </tr>`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Certificado de Auditoría Digital - ${selectedContract.id}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            h1 { font-size: 20px; color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
            .meta { margin-bottom: 30px; line-height: 1.6; }
            .seal { background: #f5f3ff; border: 1px solid #e0e7ff; padding: 15px; border-radius: 8px; font-size: 13px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; background: #f8fafc; padding: 10px; border-bottom: 2px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <h1>Certificado de Auditoría de Acuerdo Digital</h1>
          <div class="meta">
            <p><strong>ID de Contrato:</strong> ${selectedContract.id}</p>
            <p><strong>Freelancer:</strong> ${selectedContract.beneficiaryName} (RFC: ${selectedContract.freelancerRfc || "N/A"})</p>
            <p><strong>Cliente:</strong> ${selectedContract.clientName} (${selectedContract.clientEmail})</p>
            <p><strong>Fecha de Emisión:</strong> ${new Date(selectedContract.created_at).toLocaleString("es-MX")}</p>
            <p><strong>Monto Total:</strong> ${selectedContract.totalAmount} ${selectedContract.currency}</p>
          </div>
          ${
            selectedContract.contractHash
              ? `
          <div class="seal">
            <strong>Sello Digital SHA-256 de Integridad:</strong><br/>
            <code style="word-break: break-all; font-family: monospace;">${selectedContract.contractHash}</code>
          </div>`
              : ""
          }
          <h2>Historial de Transacciones (Audit Trail)</h2>
          <table>
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Actor</th>
                <th>Acción / Detalles</th>
                <th>Dirección IP</th>
              </tr>
            </thead>
            <tbody>
              ${logRows}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("demo_mode");
      document.cookie = "demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err) {
      alert("Error al cerrar sesión: " + err);
    }
  };

  const [isSeeding, setIsSeeding] = useState(false);

  const handleLoadDemoData = async () => {
    setIsSeeding(true);
    try {
      const ok = await loadSampleData();
      if (ok) {
        alert("¡Datos de ejemplo cargados con éxito! Ahora puedes probar el flujo completo en tu propio perfil.");
        await refreshData();
      } else {
        alert("No se pudieron cargar los datos de ejemplo.");
      }
    } catch (err) {
      alert("Error al cargar datos demo: " + err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCopyLink = (contractId: string) => {
    if (typeof window === "undefined") return;
    const targetCon = contracts.find(c => c.id === contractId);
    const tokenParam = targetCon?.clientAccessToken ? `?token=${targetCon.clientAccessToken}` : "";
    const demoParam = isDemo ? `${tokenParam ? "&" : "?"}demo=true` : "";
    const clientUrl = `${window.location.origin}/c/${contractId}${tokenParam}${demoParam}`;
    navigator.clipboard.writeText(clientUrl);
    setCopiedId(contractId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatMoney = (amount: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const isMilestoneOverdue = (milestone: Milestone) => {
    if (milestone.status === 'marked_paid' || milestone.status === 'confirmed') return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return milestone.dueDate < todayStr;
  };

  const isContractOverdue = (contractId: string) => {
    const contractMilestones = allMilestones.filter(m => m.contractId === contractId);
    return contractMilestones.some(m => isMilestoneOverdue(m));
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.scopeDescription.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'overdue') {
      return isContractOverdue(c.id);
    }
    return c.status === activeTab;
  });

  const getWhatsAppShareLink = (c: Contract) => {
    if (typeof window === "undefined") return "";
    const tokenPart = c.clientAccessToken ? `?token=${c.clientAccessToken}` : "";
    const demoPart = isDemo ? `${tokenPart ? "&" : "?"}demo=true` : "";
    const clientUrl = `${window.location.origin}/c/${c.id}${tokenPart}${demoPart}`;
    const text = `Hola ${c.clientName}, te comparto la propuesta de contrato de servicios profesionales por un total de ${formatMoney(c.totalAmount, c.currency)}. Puedes revisarla y firmar de conformidad electrónicamente aquí: ${clientUrl}`;
    
    if (c.clientPhone) {
      const cleanPhone = c.clientPhone.replace(/\D/g, "");
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    }
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const totalOverdueMilestones = allMilestones.filter(m => isMilestoneOverdue(m)).length;

  const contractMap = useMemo(() => {
    const map = new Map<string, { currency: string; status: string }>();
    contracts.forEach(c => {
      map.set(c.id, { currency: c.currency || 'MXN', status: c.status });
    });
    return map;
  }, [contracts]);

  const financialStats = useMemo(() => {
    const stats = {
      MXN: { confirmed: 0, marked_paid: 0, pending: 0 },
      USD: { confirmed: 0, marked_paid: 0, pending: 0 }
    };

    allMilestones.forEach(m => {
      const cMeta = contractMap.get(m.contractId);
      if (!cMeta) return;

      const curr = cMeta.currency === 'USD' ? 'USD' : 'MXN';
      const amount = m.amount || 0;

      if (m.status === 'confirmed') {
        stats[curr].confirmed += amount;
      } else if (m.status === 'marked_paid') {
        stats[curr].marked_paid += amount;
      } else {
        if (cMeta.status !== 'cancelled' && cMeta.status !== 'draft') {
          stats[curr].pending += amount;
        }
      }
    });

    return stats;
  }, [allMilestones, contractMap]);

  const contractStateStats = useMemo(() => {
    const stats = {
      draft: 0,
      sent: 0,
      client_signed: 0,
      accepted: 0,
      completed: 0,
      cancelled: 0,
      total: 0
    };

    contracts.forEach(c => {
      const status = c.status as keyof typeof stats;
      if (stats[status] !== undefined) {
        stats[status]++;
        stats['total']++;
      }
    });

    return stats;
  }, [contracts]);

  const timelineStats = useMemo(() => {
    const monthlyData: {
      [key: string]: {
        monthKey: string;
        sortKey: string;
        MXN: { total: number; confirmed: number; marked_paid: number; pending: number };
        USD: { total: number; confirmed: number; marked_paid: number; pending: number };
      }
    } = {};

    allMilestones.forEach(m => {
      const cMeta = contractMap.get(m.contractId);
      if (!cMeta || cMeta.status === 'cancelled') return;

      if (!m.dueDate) return;
      const date = new Date(m.dueDate);
      if (isNaN(date.getTime())) return;
      
      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      const monthName = months[monthIndex];
      const monthKey = `${monthName} ${year}`;
      const sortKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      if (!monthlyData[sortKey]) {
        monthlyData[sortKey] = {
          monthKey,
          sortKey,
          MXN: { total: 0, confirmed: 0, marked_paid: 0, pending: 0 },
          USD: { total: 0, confirmed: 0, marked_paid: 0, pending: 0 }
        };
      }

      const curr = cMeta.currency === 'USD' ? 'USD' : 'MXN';
      const amount = m.amount || 0;

      if (m.status === 'confirmed') {
        monthlyData[sortKey][curr].confirmed += amount;
        monthlyData[sortKey][curr].total += amount;
      } else if (m.status === 'marked_paid') {
        monthlyData[sortKey][curr].marked_paid += amount;
        monthlyData[sortKey][curr].total += amount;
      } else {
        if (cMeta.status !== 'draft') {
          monthlyData[sortKey][curr].pending += amount;
          monthlyData[sortKey][curr].total += amount;
        }
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [allMilestones, contractMap]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Panel de Control
            {isDemo && (
              <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Sandbox Demo
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra tus contratos, rastrea solicitudes de anticipos y valida transferencias recibidas.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
          >
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            {showSummary ? "Ocultar Analíticas" : "Ver Resumen Financiero"}
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
          >
            <Settings className="h-4 w-4" />
            Configurar Datos Fiscales
          </button>
          
          <Link
            href="/contracts/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Crear Contrato
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-left">
        <span className="text-3xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Crear Nuevo desde Plantilla</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/contracts/new?template=general"
            className="glass p-4 rounded-2xl border-indigo-500/10 hover:border-indigo-500/35 transition-all text-left flex flex-col justify-between h-28 group relative overflow-hidden cursor-pointer bg-white/40 dark:bg-slate-900/40"
          >
            <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-indigo-500/5 group-hover:bg-indigo-500/10 blur-xl transition-all" />
            <h4 className="font-bold text-xs text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">Plantilla General</h4>
            <p className="text-3xs text-slate-400 leading-normal mt-1">Servicios profesionales generales de honorarios.</p>
          </Link>
          <Link
            href="/contracts/new?template=development"
            className="glass p-4 rounded-2xl border-indigo-500/10 hover:border-indigo-500/35 transition-all text-left flex flex-col justify-between h-28 group relative overflow-hidden cursor-pointer bg-white/40 dark:bg-slate-900/40"
          >
            <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 blur-xl transition-all" />
            <h4 className="font-bold text-xs text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">Desarrollo Software</h4>
            <p className="text-3xs text-slate-400 leading-normal mt-1">Hitos para código, Beta y despliegue a producción.</p>
          </Link>
          <Link
            href="/contracts/new?template=design"
            className="glass p-4 rounded-2xl border-indigo-500/10 hover:border-indigo-500/35 transition-all text-left flex flex-col justify-between h-28 group relative overflow-hidden cursor-pointer bg-white/40 dark:bg-slate-900/40"
          >
            <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-indigo-500/5 group-hover:bg-indigo-500/10 blur-xl transition-all" />
            <h4 className="font-bold text-xs text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">Diseño UI/UX</h4>
            <p className="text-3xs text-slate-400 leading-normal mt-1">Esquema conceptual, revisiones y entrega final.</p>
          </Link>
          <Link
            href="/contracts/new?template=consulting"
            className="glass p-4 rounded-2xl border-indigo-500/10 hover:border-indigo-500/35 transition-all text-left flex flex-col justify-between h-28 group relative overflow-hidden cursor-pointer bg-white/40 dark:bg-slate-900/40"
          >
            <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 blur-xl transition-all" />
            <h4 className="font-bold text-xs text-slate-800 dark:text-white group-hover:text-amber-500 transition-colors">Consultoría Directa</h4>
            <p className="text-3xs text-slate-400 leading-normal mt-1">Pago único del 100% contra honorarios.</p>
          </Link>
        </div>
      </div>

      {showSummary && (
        <div className="glass rounded-3xl p-6 border-indigo-500/20 bg-white/50 dark:bg-slate-950/50 flex flex-col gap-6 text-left animate-in slide-in-from-top-4 duration-300">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Resumen de Flujo y Estados de Contrato
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualiza tus ingresos cobrados, fondos en tránsito de validación y tus cobros futuros proyectados en base a tu cronograma mensual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-5 border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-1.5 shadow-sm">
              <span className="text-2xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ingresos Verificados (Cobrado)
              </span>
              <div className="flex flex-col gap-1">
                {(financialStats.MXN.confirmed > 0 || financialStats.USD.confirmed === 0) && (
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatMoney(financialStats.MXN.confirmed, 'MXN')}
                  </span>
                )}
                {financialStats.USD.confirmed > 0 && (
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-350">
                    {formatMoney(financialStats.USD.confirmed, 'USD')}
                  </span>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-5 border-amber-500/20 bg-amber-500/5 flex flex-col gap-1.5 shadow-sm">
              <span className="text-2xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                En Tránsito (Por Validar)
              </span>
              <div className="flex flex-col gap-1">
                {(financialStats.MXN.marked_paid > 0 || financialStats.USD.marked_paid === 0) && (
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatMoney(financialStats.MXN.marked_paid, 'MXN')}
                  </span>
                )}
                {financialStats.USD.marked_paid > 0 && (
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-350">
                    {formatMoney(financialStats.USD.marked_paid, 'USD')}
                  </span>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-5 border-indigo-500/20 bg-indigo-500/5 flex flex-col gap-1.5 shadow-sm">
              <span className="text-2xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                Proyectado Futuro (Por Cobrar)
              </span>
              <div className="flex flex-col gap-1">
                {(financialStats.MXN.pending > 0 || financialStats.USD.pending === 0) && (
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatMoney(financialStats.MXN.pending, 'MXN')}
                  </span>
                )}
                {financialStats.USD.pending > 0 && (
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-350">
                    {formatMoney(financialStats.USD.pending, 'USD')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-5">
            <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-3">Distribución por Estado de Contrato</h4>
            <div className="flex flex-col gap-2">
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                {contractStateStats.total > 0 ? (
                  <>
                    <div 
                      className="bg-slate-400 dark:bg-slate-500 transition-all duration-300" 
                      style={{ width: `${(contractStateStats.draft / contractStateStats.total) * 100}%` }}
                      title={`Borradores: ${contractStateStats.draft}`}
                    />
                    <div 
                      className="bg-amber-500 transition-all duration-300" 
                      style={{ width: `${(contractStateStats.sent / contractStateStats.total) * 100}%` }}
                      title={`Pendientes: ${contractStateStats.sent}`}
                    />
                    <div 
                      className="bg-purple-500 transition-all duration-300" 
                      style={{ width: `${(contractStateStats.client_signed / contractStateStats.total) * 100}%` }}
                      title={`Firmados Cliente: ${contractStateStats.client_signed}`}
                    />
                    <div 
                      className="bg-indigo-600 transition-all duration-300" 
                      style={{ width: `${(contractStateStats.accepted / contractStateStats.total) * 100}%` }}
                      title={`Sellados Activos: ${contractStateStats.accepted}`}
                    />
                    <div 
                      className="bg-emerald-500 transition-all duration-300" 
                      style={{ width: `${(contractStateStats.completed / contractStateStats.total) * 100}%` }}
                      title={`Completados: ${contractStateStats.completed}`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-slate-100 dark:bg-slate-900" />
                )}
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-3xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                  Borrador: <span className="text-slate-850 dark:text-slate-200 font-black">{contractStateStats.draft}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Pendiente: <span className="text-slate-850 dark:text-slate-200 font-black">{contractStateStats.sent}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  Firmado Cliente: <span className="text-slate-850 dark:text-slate-200 font-black">{contractStateStats.client_signed}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                  Activo / Sellado: <span className="text-slate-850 dark:text-slate-200 font-black">{contractStateStats.accepted}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Completado: <span className="text-slate-850 dark:text-slate-200 font-black">{contractStateStats.completed}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-5">
            <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-4">Cronograma Mensual de Cobros (Timeline)</h4>
            
            {timelineStats.length > 0 ? (
              <div className="flex flex-col gap-4 max-h-[250px] overflow-y-auto pr-2">
                {timelineStats.map((item) => (
                  <div key={item.sortKey} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center border-b border-slate-100 dark:border-slate-900/40 pb-3 last:border-b-0 last:pb-0">
                    <div className="sm:col-span-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {item.monthKey}
                    </div>
                    
                    <div className="sm:col-span-9 flex flex-col gap-2">
                      {item.MXN.total > 0 && (
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-3xs font-mono text-slate-400 dark:text-slate-500 w-24 text-left">MXN: {formatMoney(item.MXN.total, 'MXN')}</span>
                          <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-900/60 rounded-full overflow-hidden flex shadow-inner">
                            {item.MXN.confirmed > 0 && (
                              <div 
                                className="bg-emerald-500/80 hover:bg-emerald-500 transition-all duration-300" 
                                style={{ width: `${(item.MXN.confirmed / item.MXN.total) * 100}%` }}
                                title={`Cobrado: ${formatMoney(item.MXN.confirmed, 'MXN')}`}
                              />
                            )}
                            {item.MXN.marked_paid > 0 && (
                              <div 
                                className="bg-amber-500/80 hover:bg-amber-500 transition-all duration-300 animate-pulse" 
                                style={{ width: `${(item.MXN.marked_paid / item.MXN.total) * 100}%` }}
                                title={`Por Validar: ${formatMoney(item.MXN.marked_paid, 'MXN')}`}
                              />
                            )}
                            {item.MXN.pending > 0 && (
                              <div 
                                className="bg-indigo-500/30 hover:bg-indigo-500/50 transition-all duration-300" 
                                style={{ width: `${(item.MXN.pending / item.MXN.total) * 100}%` }}
                                title={`Por Cobrar: ${formatMoney(item.MXN.pending, 'MXN')}`}
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {item.USD.total > 0 && (
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-3xs font-mono text-slate-400 dark:text-slate-500 w-24 text-left">USD: {formatMoney(item.USD.total, 'USD')}</span>
                          <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-900/60 rounded-full overflow-hidden flex shadow-inner">
                            {item.USD.confirmed > 0 && (
                              <div 
                                className="bg-emerald-500/80 hover:bg-emerald-500 transition-all duration-300" 
                                style={{ width: `${(item.USD.confirmed / item.USD.total) * 100}%` }}
                                title={`Cobrado: ${formatMoney(item.USD.confirmed, 'USD')}`}
                              />
                            )}
                            {item.USD.marked_paid > 0 && (
                              <div 
                                className="bg-amber-500/80 hover:bg-amber-500 transition-all duration-300 animate-pulse" 
                                style={{ width: `${(item.USD.marked_paid / item.USD.total) * 100}%` }}
                                title={`Por Validar: ${formatMoney(item.USD.marked_paid, 'USD')}`}
                              />
                            )}
                            {item.USD.pending > 0 && (
                              <div 
                                className="bg-indigo-500/30 hover:bg-indigo-500/50 transition-all duration-300" 
                                style={{ width: `${(item.USD.pending / item.USD.total) * 100}%` }}
                                title={`Por Cobrar: ${formatMoney(item.USD.pending, 'USD')}`}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="flex gap-4 text-3xs font-semibold text-slate-400 uppercase tracking-widest justify-end mt-2">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Cobrado
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Por Validar
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-indigo-500/40" />
                    Por Cobrar
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No hay hitos programados en este momento.</p>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="glass rounded-3xl p-6 border-indigo-550/20 bg-white/50 dark:bg-slate-950/50 flex flex-col gap-6 text-left animate-in slide-in-from-top-4 duration-300">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Settings className="h-5 w-5 text-indigo-500" />
              Tus Datos Fiscales y Bancarios
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Esta información se plasmará automáticamente en la carátula y el CEP de tus contratos para dar formalidad y transparencia a tu cliente.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Nombre Completo Titular</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">RFC Emisor (13 caracteres)</label>
              <input
                type="text"
                maxLength={13}
                placeholder="Ej. GUEH860710MX3"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white uppercase font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Régimen Fiscal (Sat)</label>
              <select
                value={regimenFiscal}
                onChange={(e) => setRegimenFiscal(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white dark:bg-slate-900"
              >
                <option value="">Selecciona una opción...</option>
                <option value="626 - Régimen Simplificado de Confianza (RESICO)">626 - Régimen Simplificado de Confianza (RESICO)</option>
                <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                <option value="605 - Sueldos y Salarios e Ingresos Asimilados a Salarios">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Código Postal Fiscal</label>
              <input
                type="text"
                maxLength={5}
                placeholder="Ej. 06700"
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Teléfono (WhatsApp)</label>
              <input
                type="tel"
                placeholder="Ej. +525512345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Banco Receptor</label>
              <input
                type="text"
                required
                placeholder="Ej. BBVA México o STP"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">CLABE Interbancaria (18 dígitos)</label>
              <input
                type="text"
                maxLength={18}
                required
                placeholder="18 dígitos para SPEI"
                value={clabe}
                onChange={(e) => setClabe(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Logo de tu Empresa (PNG, JPG, SVG - Máx 2MB)</label>
              {profile?.tier === "free" ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 px-4 py-2 text-xs text-slate-450">
                  🔒 Disponible en Planes de Pago. Sube a un plan Starter o Pro para personalizar tu marca.
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={(e) => handleBrandFileUpload(e.target.files?.[0], "logo")}
                    className="flex-grow rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                  />
                  {logoUrl && (
                    <img src={logoUrl} alt="Preview Logo" className="h-10 w-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5" />
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Firma Digital (PNG, JPG - Máx 2MB)</label>
              {profile?.tier === "free" ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 px-4 py-2 text-xs text-slate-450">
                  🔒 Disponible en Planes de Pago.
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => handleBrandFileUpload(e.target.files?.[0], "signature")}
                    className="flex-grow rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                  />
                  {signatureUrl && (
                    <img src={signatureUrl} alt="Preview Signature" className="h-10 w-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5" />
                  )}
                </div>
              )}
            </div>

            {uploadError && (
              <div className="md:col-span-3 text-xs text-red-500 font-semibold bg-red-500/5 p-2 rounded-xl border border-red-500/10">
                ⚠️ {uploadError}
              </div>
            )}

            {/* Payment Profiles CRUD Section */}
            <div className="md:col-span-3 border-t border-slate-200 dark:border-slate-800 pt-6 mt-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Perfiles de Pago Bancarios</h4>
                  <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Registra múltiples cuentas para prellenar datos rápidamente al generar nuevos contratos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(null);
                    setProfileNickname("");
                    setProfileBankName("");
                    setProfileClabe("");
                    setProfileInstructions("");
                    setShowProfileForm(!showProfileForm);
                  }}
                  className="rounded-xl bg-indigo-50 dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 border border-indigo-200/50 dark:border-slate-800 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {showProfileForm ? "Cerrar Formulario" : "Agregar Cuenta"}
                </button>
              </div>

              {showProfileForm && (
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-semibold text-slate-455 uppercase tracking-wider">Apodo de la Cuenta (Ej. Nómina, USD Principal)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Mi Cuenta Principal"
                      value={profileNickname}
                      onChange={(e) => setProfileNickname(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-semibold text-slate-455 uppercase tracking-wider">Banco Receptor</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. BBVA, Santander, STP"
                      value={profileBankName}
                      onChange={(e) => setProfileBankName(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-semibold text-slate-455 uppercase tracking-wider">CLABE Interbancaria (18 dígitos)</label>
                    <input
                      type="text"
                      maxLength={18}
                      required
                      placeholder="18 dígitos"
                      value={profileClabe}
                      onChange={(e) => setProfileClabe(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-semibold text-slate-455 uppercase tracking-wider">Instrucciones de Pago Adicionales (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Transferir neto antes de las 5pm"
                      value={profileInstructions}
                      onChange={(e) => setProfileInstructions(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={!profileNickname || !profileBankName || profileClabe.length !== 18}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-semibold px-4 py-2 text-xs transition-colors shadow-md shadow-indigo-500/10 disabled:opacity-50 cursor-pointer"
                    >
                      Guardar Perfil
                    </button>
                  </div>
                </div>
              )}

              {paymentProfiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentProfiles.map((p) => (
                    <div key={p.id} className={`rounded-2xl border p-4 text-xs flex flex-col justify-between gap-3 ${p.isDefault ? "border-indigo-500 bg-indigo-500/5" : "border-slate-200 dark:border-slate-800"}`}>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                            {p.nickname}
                            {p.isDefault && <span className="rounded-full bg-indigo-500 text-white text-3xs px-1.5 py-0.5 font-semibold">Predeterminado</span>}
                          </span>
                          <span className="font-mono text-slate-400">{p.bankName}</span>
                        </div>
                        <p className="font-mono text-slate-600 dark:text-slate-350 break-all select-all mt-1">CLABE: {p.clabe}</p>
                        {p.paymentInstructions && (
                          <p className="text-3xs text-slate-450 italic mt-1">Nota: {p.paymentInstructions}</p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-850/50 pt-2.5">
                        {!p.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultProfile(p.id)}
                            className="text-3xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Hacer Predeterminado
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfile(p);
                            setProfileNickname(p.nickname);
                            setProfileBankName(p.bankName);
                            setProfileClabe(p.clabe);
                            setProfileInstructions(p.paymentInstructions || "");
                            setShowProfileForm(true);
                          }}
                          className="text-3xs font-semibold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProfile(p.id)}
                          className="text-3xs font-semibold text-red-650 hover:underline cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400 font-light leading-normal">
                  No has registrado perfiles de pago adicionales. El sistema usará la cuenta CLABE registrada arriba por defecto.
                </div>
              )}
            </div>

            <div className="md:col-span-3 flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl border border-red-200 dark:border-red-900 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 px-5 py-2.5 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar Sesión
              </button>
              <div className="flex gap-3 items-center">
                {saveSuccess && (
                  <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Perfil guardado con éxito
                  </span>
                )}
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Buscar cliente, email o alcance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white placeholder:text-slate-400 shadow-sm"
            />

            <div className="flex flex-wrap gap-1.5 mt-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  activeTab === 'all' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white/40 dark:bg-slate-900/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveTab('draft')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  activeTab === 'draft' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white/40 dark:bg-slate-900/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Borradores
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  activeTab === 'sent' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white/40 dark:bg-slate-900/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Enviados
              </button>
              <button
                onClick={() => setActiveTab('client_signed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  activeTab === 'client_signed' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white/40 dark:bg-slate-900/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Firmados (Cli)
              </button>
              <button
                onClick={() => setActiveTab('accepted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  activeTab === 'accepted' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white/40 dark:bg-slate-900/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Sellados
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  activeTab === 'completed' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white/40 dark:bg-slate-900/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Completados
              </button>
              <button
                onClick={() => setActiveTab('overdue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                  activeTab === 'overdue' 
                    ? 'bg-red-600 text-white shadow-sm' 
                    : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/25'
                }`}
              >
                Atrasados
                {totalOverdueMilestones > 0 && (
                  <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-4xs font-black">
                    {totalOverdueMilestones}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] pr-2">
            {contracts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-950/20 p-8 text-center flex flex-col items-center gap-3.5 border-dashed">
                <span className="text-xs text-slate-400 font-light">Aún no tienes contratos registrados en tu cuenta.</span>
                <button
                  type="button"
                  onClick={handleLoadDemoData}
                  disabled={isSeeding}
                  className="rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-550 dark:text-indigo-400 font-bold px-4 py-2 text-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSeeding ? "Cargando..." : "Cargar Datos de Ejemplo"}
                </button>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-950/20 p-8 text-center text-xs text-slate-400 font-light border-dashed">
                No se encontraron contratos con los criterios seleccionados.
              </div>
            ) : (
              filteredContracts.map((contract) => {
                const isOverdue = isContractOverdue(contract.id);
                return (
                  <div
                    key={contract.id}
                    onClick={() => handleSelectContract(contract)}
                    className={`rounded-2xl border p-4 text-left cursor-pointer transition-all hover:translate-x-1 duration-200 ${
                      selectedContract?.id === contract.id
                        ? "border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/5"
                        : "border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {contract.clientName}
                      </span>
                      <span className={`text-4xs font-black uppercase tracking-wider rounded px-1.5 py-0.5 ${
                        contract.status === 'completed'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                          : contract.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : contract.status === 'client_signed'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400'
                          : contract.status === 'sent'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400'
                      }`}>
                        {contract.status === 'draft' ? 'Borrador' : contract.status === 'sent' ? 'Enviado' : contract.status === 'client_signed' ? 'Firma Cli' : contract.status === 'accepted' ? 'Sellado' : contract.status === 'completed' ? 'Completo' : 'Cancelado'}
                      </span>
                    </div>

                    <p className="text-3xs text-slate-400 mt-1 line-clamp-1 font-mono">
                      ID: {contract.id.substring(0, 15)}...
                    </p>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {contract.scopeDescription}
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-900/60 pt-3 mt-3">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {formatMoney(contract.totalAmount, contract.currency)}
                      </span>
                      {isOverdue && (
                        <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-4xs font-extrabold uppercase animate-pulse">
                          Atrasado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedContract ? (
            <div className="glass rounded-3xl p-6 flex flex-col gap-6 text-left animate-in fade-in-50 duration-300">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detalles de Contrato</span>
                  <h2 className="text-2xl font-extrabold mt-0.5 text-slate-900 dark:text-white">
                    {selectedContract.clientName}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Contacto: <span className="font-semibold text-indigo-500">{selectedContract.clientEmail}</span>
                  </p>
                  {selectedContract.clientRfc && (
                    <p className="text-xs text-slate-400 mt-1">
                      RFC Cliente: <span className="font-semibold text-slate-600 dark:text-slate-300">{selectedContract.clientRfc}</span>
                      {selectedContract.clientRegimen && ` • Régimen: ${selectedContract.clientRegimen}`}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(selectedContract.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                  >
                    {copiedId === selectedContract.id ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copiar Link Cliente
                      </>
                    )}
                  </button>
                  <a
                    href={getWhatsAppShareLink(selectedContract)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-2 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Enviar WhatsApp
                  </a>
                  
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Ver Contrato
                  </button>
                  <Link
                    href={`/c/${selectedContract.id}?token=${selectedContract.clientAccessToken || ''}${isDemo ? '&demo=true' : ''}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver de Cliente
                  </Link>
                </div>
              </div>

              {selectedContract.status === 'draft' && (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-850 dark:text-amber-400 flex flex-col gap-2.5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Estado: Borrador</span>. Este contrato aún no ha sido compartido oficialmente. Puedes realizar cambios o marcarlo como enviado para activar las solicitudes de anticipos.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateContractStatus('sent')}
                      className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Marcar como Enviado
                    </button>
                    <button
                      onClick={startEditingContract}
                      className="border border-amber-300 dark:border-amber-700 bg-white/20 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900 text-amber-800 dark:text-amber-400 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Modificar Propuesta
                    </button>
                  </div>
                </div>
              )}

              {selectedContract.status === 'sent' && (
                <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 text-sm text-indigo-800 dark:text-indigo-400 flex flex-col gap-2.5">
                  <div className="flex items-start gap-3">
                    <Send className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Estado: Enviado (Pendiente de Aceptación)</span>. Envía el enlace al cliente para que revise el alcance y firme de aceptado electrónicamente.
                    </div>
                  </div>
                  <button
                    onClick={startEditingContract}
                    className="w-full mt-1 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white/40 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 text-indigo-650 dark:text-indigo-400 font-bold py-2 text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    Modificar Propuesta
                  </button>
                </div>
              )}

              {selectedContract.status === 'client_signed' && (
                <div className="rounded-2xl bg-purple-500/10 border border-purple-500/20 p-4 text-sm text-purple-800 dark:text-purple-400 flex flex-col gap-2.5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <span className="font-bold">Firmado por Cliente (Validación Requerida)</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        El cliente ya firmó digitalmente: <span className="font-semibold text-slate-700 dark:text-slate-350">{selectedContract.acceptedByName}</span> (IP: {selectedContract.acceptedIp}). Por favor verifica que los datos y los hitos financieros sean correctos antes de contra-firmar para sellar el acuerdo legal.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={handleVetAndCounterSign}
                      className="rounded-xl bg-purple-600 hover:bg-purple-550 text-white font-bold py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/10"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Validar y Contra-firmar
                    </button>
                    <button
                      onClick={startEditingContract}
                      className="rounded-xl border border-purple-200 dark:border-purple-800 bg-white/40 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 text-purple-750 dark:text-purple-400 font-bold py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      Modificar Propuesta
                    </button>
                  </div>
                </div>
              )}

              {selectedContract.status === 'accepted' && (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-400 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <span className="font-bold">Contrato Firmado Dualmente (Sellado)</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Cliente: <span className="font-semibold text-slate-700 dark:text-slate-350">{selectedContract.acceptedByName}</span> • IP: {selectedContract.acceptedIp}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Freelancer: <span className="font-semibold text-slate-700 dark:text-slate-350">{selectedContract.freelancerAcceptedByName}</span> • IP: {selectedContract.freelancerAcceptedIp}
                      </p>
                    </div>
                  </div>
                  
                  {/* Completion status info */}
                  {selectedContract.freelancerCompletedAt ? (
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold border-t border-emerald-500/10 pt-2 flex items-center gap-1.5 animate-pulse-subtle">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      Entregado por tu parte. Esperando confirmación del cliente.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-emerald-500/10 pt-3">
                      <button
                        onClick={handleMarkCompleted}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Marcar Proyecto como Completado
                      </button>
                      <button
                        onClick={() => setIsCancellingContract(true)}
                        className="rounded-xl border border-red-200 dark:border-red-900 bg-white/20 dark:bg-slate-900/20 text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Cancelar Contrato (Detener Proyecto)
                      </button>
                    </div>
                  )}

                  <div className="text-3xs text-slate-400 bg-slate-100 dark:bg-slate-900/50 rounded-lg p-2 font-mono break-all mt-2 select-all">
                    Integrity Hash: {selectedContract.contractHash}
                  </div>
                </div>
              )}

              {selectedContract.status === 'completed' && (
                <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 text-sm text-blue-800 dark:text-blue-400 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-500" />
                  <div>
                    <span className="font-bold">Proyecto Completado & Cobrado</span>. Todos los hitos financieros han sido saldados y verificados. ¡Buen trabajo!
                  </div>
                </div>
              )}

              {selectedContractLogs.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Centro de Notificaciones & Alertas</span>
                  <div className="flex flex-col gap-2">
                    {(() => {
                      const alerts: { text: string; type: 'success' | 'warning' | 'info'; actionLink?: string; actionText?: string }[] = [];
                      
                      const tokenPart = selectedContract.clientAccessToken ? `?token=${selectedContract.clientAccessToken}` : "";
                      const demoPart = isDemo ? `${tokenPart ? "&" : "?"}demo=true` : "";
                      const clientUrl = `${window.location.origin}/c/${selectedContract.id}${tokenPart}${demoPart}`;
                      const cleanClientPhone = selectedContract.clientPhone ? selectedContract.clientPhone.replace(/\D/g, "") : "";
                      
                      const getWaLink = (phone: string, text: string) => {
                        if (phone) return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
                        return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                      };

                      // 1. Contract Status Alerts
                      if (selectedContract.status === 'sent') {
                        const text = `Hola ${selectedContract.clientName}, te comparto la propuesta de contrato de servicios profesionales por un total de ${formatMoney(selectedContract.totalAmount, selectedContract.currency)}. Puedes revisarla y firmar electrónicamente de conformidad aquí: ${clientUrl}`;
                        alerts.push({
                          text: `Propuesta de contrato enviada. Pendiente de firma.`,
                          type: 'info',
                          actionLink: getWaLink(cleanClientPhone, text),
                          actionText: 'Compartir por WhatsApp'
                        });
                      }

                      if (selectedContract.status === 'client_signed') {
                        alerts.push({
                          text: `El cliente ha firmado el contrato digitalmente. Pendiente de tu validación y firma final.`,
                          type: 'warning'
                        });
                      }

                      if (selectedContract.status === 'accepted') {
                        const text = `Hola ${selectedContract.clientName}, ya validé y firmé de conformidad el contrato. El documento se encuentra sellado con huella digital y activo. Puedes ver tu copia aquí: ${clientUrl}`;
                        alerts.push({
                          text: `Contrato aceptado y sellado digitalmente.`,
                          type: 'success',
                          actionLink: getWaLink(cleanClientPhone, text),
                          actionText: 'Notificar por WhatsApp'
                        });
                      }

                      // Revision Proposed (status is draft and has revision logs)
                      const revisionLogs = selectedContractLogs.filter(l => l.action === 'revision_proposed');
                      if (selectedContract.status === 'draft' && revisionLogs.length > 0) {
                        const latestRevLog = revisionLogs[0];
                        if (latestRevLog.actor === 'client') {
                          alerts.push({
                            text: `El cliente solicitó una revisión. Motivo: ${latestRevLog.details}`,
                            type: 'warning'
                          });
                        } else {
                          const text = `Hola ${selectedContract.clientName}, actualicé el contrato con cambios y regresó a estado de borrador para tu revisión. Puedes verlo aquí: ${clientUrl}`;
                          alerts.push({
                            text: `Has propuesto una revisión al contrato. Regresó a borrador.`,
                            type: 'info',
                            actionLink: getWaLink(cleanClientPhone, text),
                            actionText: 'Notificar por WhatsApp'
                          });
                        }
                      }

                      // 2. Milestone Status Alerts
                      milestones.forEach(m => {
                        if (m.status === 'requested') {
                          const overdue = isMilestoneOverdue(m);
                          const text = `Hola ${selectedContract.clientName}, te solicito el pago del hito "${m.label}" por un monto de ${formatMoney(m.amount, selectedContract.currency)}. Puedes reportar tu pago de transferencia SPEI adjuntando el comprobante aquí: ${clientUrl}`;
                          alerts.push({
                            text: `Cobro del hito "${m.label}" (${formatMoney(m.amount, selectedContract.currency)}) solicitado al cliente${overdue ? ' y se encuentra ATRASADO' : ''}.`,
                            type: overdue ? 'warning' : 'info',
                            actionLink: getWaLink(cleanClientPhone, text),
                            actionText: 'Recordar por WhatsApp'
                          });
                        }
                        if (m.status === 'marked_paid') {
                          alerts.push({
                            text: `El cliente ha reportado el pago del hito "${m.label}" (${formatMoney(m.amount, selectedContract.currency)}) con folio/ref: ${m.trackingReference}. Favor de verificar SPEI.`,
                            type: 'info'
                          });
                        }
                        if (m.status === 'confirmed') {
                          const text = `Hola ${selectedContract.clientName}, he verificado y confirmado tu pago de ${formatMoney(m.amount, selectedContract.currency)} para el hito "${m.label}". ¡Muchas gracias!`;
                          alerts.push({
                            text: `Pago confirmado para el hito "${m.label}".`,
                            type: 'success',
                            actionLink: getWaLink(cleanClientPhone, text),
                            actionText: 'Enviar Agradecimiento'
                          });
                        }
                      });

                      if (alerts.length === 0) {
                        return <p className="text-3xs text-slate-400 italic">No hay alertas activas en este acuerdo.</p>;
                      }

                      return alerts.map((alert, idx) => (
                        <div 
                          key={idx} 
                          className={`rounded-xl border p-3 text-xs flex justify-between items-center gap-3 transition-all ${
                            alert.type === 'success' 
                              ? 'bg-emerald-550/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400' 
                              : alert.type === 'warning'
                              ? 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-400 font-semibold'
                              : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-800 dark:text-indigo-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                            <span>{alert.text}</span>
                          </div>
                          {alert.actionLink && (
                            <a 
                              href={alert.actionLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-3xs font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-2.5 py-1 transition-all"
                            >
                              {alert.actionText}
                            </a>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alcance de Trabajo</span>
                <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-4 text-sm leading-relaxed border border-slate-100 dark:border-slate-800/50">
                  {selectedContract.scopeDescription}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Esquema de Anticipos e Hitos</span>
                  <span className="text-xs font-bold text-indigo-500">
                    Total: {formatMoney(selectedContract.totalAmount, selectedContract.currency)}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {milestones.map((milestone) => {
                    const overdue = isMilestoneOverdue(milestone);
                    return (
                      <div
                        key={milestone.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 p-4 flex flex-col gap-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                              {milestone.label}
                              {overdue && (
                                <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-4xs font-bold uppercase animate-pulse">
                                  Atrasado
                                </span>
                              )}
                            </h4>
                            <span className="text-xs text-slate-400">
                              Vencimiento: {new Date(milestone.dueDate).toLocaleDateString('es-MX')}
                            </span>
                          </div>
                          
                          <span className={`text-2xs font-extrabold uppercase tracking-wider rounded-lg px-2.5 py-1 self-start sm:self-center ${
                            milestone.status === 'confirmed'
                              ? 'bg-indigo-500/10 text-indigo-500'
                              : milestone.status === 'marked_paid'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : milestone.status === 'requested'
                              ? 'bg-amber-500/10 text-amber-500 animate-pulse-subtle'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-900'
                          }`}>
                            {milestone.status === 'pending' ? 'pendiente' : milestone.status === 'requested' ? 'cobro enviado' : milestone.status === 'marked_paid' ? 'transferencia reportada' : 'confirmado'}
                          </span>
                        </div>

                        {milestone.status === 'marked_paid' && milestone.trackingReference && (
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-xs leading-relaxed">
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              El cliente reportó transferencia bancaria:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 mt-1 font-light">
                              <p>Clave de Rastreo SPEI: <span className="font-bold font-mono text-slate-700 dark:text-slate-350 select-all">{milestone.trackingReference}</span></p>
                              {milestone.transferredAmount && (
                                <p>Monto Declarado: <span className="font-bold text-slate-700 dark:text-slate-350">{formatMoney(milestone.transferredAmount, selectedContract.currency)}</span></p>
                              )}
                              {milestone.exchangeRate && milestone.mxnAmount && (
                                <p className="sm:col-span-2">Tipo de cambio: <span className="font-bold text-slate-700 dark:text-slate-350">${milestone.exchangeRate.toFixed(4)}</span> | Equiv. MXN: <span className="font-bold text-slate-700 dark:text-slate-350">{formatMoney(milestone.mxnAmount, "MXN")}</span></p>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-emerald-500/10">
                              <a 
                                href={`https://www.banxico.org.mx/cep/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1 text-2xs transition-colors"
                              >
                                Verificar CEP en Banxico
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {milestone.receiptUrl && (
                                <a 
                                  href={milestone.receiptUrl.startsWith('http') ? milestone.receiptUrl : `https://${milestone.receiptUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 text-2xs transition-colors"
                                >
                                  Ver comprobante adjunto
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                            {formatMoney(milestone.amount, selectedContract.currency)}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {(selectedContract.status === 'accepted' || selectedContract.status === 'completed') ? (
                              <>
                                {milestone.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateMilestone(milestone.id, 'requested')}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                                  >
                                    Solicitar Cobro
                                  </button>
                                )}
                                
                                {milestone.status === 'requested' && (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleUpdateMilestone(milestone.id, 'pending')}
                                      title="Revertir a Pendiente"
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenPaymentModal(milestone)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                                    >
                                      Marcar como Pagado
                                    </button>
                                  </div>
                                )}
                                
                                {milestone.status === 'marked_paid' && (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleUpdateMilestone(milestone.id, 'requested')}
                                      title="Revertir a Solicitado"
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleUpdateMilestone(milestone.id, 'confirmed')}
                                      className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors shadow-md shadow-indigo-500/10"
                                    >
                                      Confirmar Recepción
                                    </button>
                                  </div>
                                )}
                                {(milestone.status === 'confirmed') && (
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleUpdateMilestone(milestone.id, 'marked_paid')}
                                        title="Revertir a Reportado"
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors mr-1"
                                      >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                      </button>
                                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                                        Cobro Listo
                                      </span>
                                    </div>
                                    {milestone.receiptUrl && (
                                      <a 
                                        href={milestone.receiptUrl.startsWith('http') ? milestone.receiptUrl : `https://${milestone.receiptUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-3xs text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-0.5 mt-0.5"
                                      >
                                        Ver recibo
                                        <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    )}
                                    {milestone.exchangeRate && milestone.mxnAmount && (
                                      <span className="text-4xs text-slate-400 mt-1 block">
                                        TC: ${milestone.exchangeRate.toFixed(4)} | Equiv: {formatMoney(milestone.mxnAmount, "MXN")}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Contrato pendiente</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-850 pt-5 flex flex-col gap-6">
                {selectedContract.contractHash && (
                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Sello de Integridad Criptográfica</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-light text-2xs">
                      Este código SHA-256 asegura la inmutabilidad legal del acuerdo. Captura de forma única el alcance, los hitos acordados y las firmas IP de ambas partes. Cualquier cambio posterior rompería la firma.
                    </p>
                    <div className="bg-slate-100 dark:bg-slate-900/60 p-2 rounded-lg font-mono text-3xs text-slate-400 break-all select-all font-light">
                      {selectedContract.contractHash}
                    </div>
                  </div>
                )}
                
                {contractVersions.length > 0 && (
                  <div className="flex flex-col gap-4 text-left border-t border-slate-100 dark:border-slate-850 pt-5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Historial de Versiones Propuestas</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {contractVersions.map((v) => (
                        <div key={v.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 p-3 text-xs flex justify-between items-start gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                              <span>Versión {v.versionNumber}</span>
                              <span className="text-3xs font-semibold bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 text-slate-400">
                                {new Date(v.modifiedAt).toLocaleDateString('es-MX')}
                              </span>
                            </div>
                            <p className="text-3xs text-slate-400 leading-normal italic">
                              &ldquo;{v.reason || 'Sin descripción'}&rdquo;
                            </p>
                            <p className="text-3xs text-slate-505 dark:text-slate-400 font-light line-clamp-2">
                              Alcance: {v.scopeDescription}
                            </p>
                          </div>
                          <div className="text-right font-extrabold text-slate-800 dark:text-slate-200 shrink-0">
                            {formatMoney(v.totalAmount, v.currency)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedContractLogs.length > 0 && (
                  <div className="flex flex-col gap-4 text-left border-t border-slate-100 dark:border-slate-850 pt-5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Historial del Contrato (Audit Trail)</span>
                      <button
                        onClick={handleExportAuditLog}
                        className="inline-flex items-center gap-1 text-3xs font-bold text-indigo-500 hover:text-indigo-650 transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Exportar Audit Log
                      </button>
                    </div>
                    
                    <div className="flow-root mt-1">
                      <ul role="list" className="-mb-8">
                        {selectedContractLogs.map((log, logIdx) => (
                          <li key={log.id}>
                            <div className="relative pb-8">
                              {logIdx !== selectedContractLogs.length - 1 ? (
                                <span className="absolute left-3 top-3 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                              ) : null}
                              <div className="relative flex space-x-2.5 items-start">
                                <div>
                                  <span className={`h-6 w-6 rounded-full flex items-center justify-center ring-6 ring-white dark:ring-slate-950 ${
                                    log.action === 'created' ? 'bg-slate-150 dark:bg-slate-900 text-slate-500' :
                                    log.action === 'client_signed' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-600' :
                                    log.action === 'freelancer_accepted' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' :
                                    log.action === 'milestone_requested' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600' :
                                    log.action === 'milestone_transferred' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600' :
                                    'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600'
                                  }`}>
                                    {log.action === 'created' && <Briefcase className="h-3 w-3" />}
                                    {log.action === 'client_signed' && <ShieldCheck className="h-3 w-3" />}
                                    {log.action === 'freelancer_accepted' && <CheckCircle2 className="h-3 w-3" />}
                                    {log.action === 'milestone_requested' && <Clock className="h-3 w-3" />}
                                    {log.action === 'milestone_transferred' && <CreditCard className="h-3 w-3" />}
                                    {log.action === 'milestone_confirmed' && <CheckCircle2 className="h-3 w-3" />}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5 flex justify-between space-x-2">
                                  <div>
                                    <p className="text-2xs text-slate-700 dark:text-slate-350 leading-relaxed font-light">
                                      {log.details}
                                      {log.ip && <span className="text-3xs text-slate-400 block mt-0.5 font-mono">IP: {log.ip}</span>}
                                    </p>
                                  </div>
                                  <div className="text-right text-3xs whitespace-nowrap text-slate-400 self-start">
                                    {new Date(log.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass rounded-3xl p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-4 flex-grow border-dashed border-2">
              <FileText className="h-12 w-12 text-slate-300" />
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300">Sin Contrato Seleccionado</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Por favor selecciona un contrato en la lista lateral o crea uno nuevo para ver su flujo financiero.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPreviewModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:hidden overflow-y-auto">
          <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-indigo-500/20">
            {/* Header toolbar */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 sticky top-0 z-10 rounded-t-3xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Vista Previa del Contrato
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Imprimir / PDF
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Paper content */}
            <div className="p-8 flex flex-col gap-8 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 m-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-3xl mx-auto w-full">
              {/* Proposal Header */}
              <div className="flex flex-col items-center gap-3 pb-6 border-b border-slate-150 dark:border-slate-800">
                {profile?.logoUrl && (
                  <img src={profile.logoUrl} alt="Logo" className="h-16 object-contain rounded-xl border border-slate-100 dark:border-slate-800 bg-white p-1" />
                )}
                <div className="text-center">
                  <h1 className="text-2xl font-extrabold text-indigo-500 uppercase tracking-wider">PROPUESTA DE SERVICIOS PROFESIONALES</h1>
                  <p className="text-xs text-slate-400 mt-1">ID Contrato: <span className="font-mono">{selectedContract.id}</span></p>
                </div>
              </div>

              {/* Parties info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                <div>
                  <h3 className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-2">Prestador (Freelancer)</h3>
                  <p className="font-bold text-slate-900 dark:text-white">{profile?.fullName || 'Héctor J. Guerrero'}</p>
                  <p className="text-xs text-slate-500 mt-1">{profile?.email || 'hector@freelancemx.dev'}</p>
                  {selectedContract.freelancerRfc && (
                    <p className="text-2xs text-slate-400 mt-1">RFC: {selectedContract.freelancerRfc} • Régimen: {selectedContract.freelancerRegimen}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cliente Receptor</h3>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedContract.clientName}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedContract.clientEmail}</p>
                  {selectedContract.clientRfc && (
                    <p className="text-2xs text-slate-400 mt-1">RFC: {selectedContract.clientRfc} • Régimen: {selectedContract.clientRegimen}</p>
                  )}
                </div>
              </div>

              {/* Scope of Work */}
              <div>
                <h3 className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-3">Concepto y Alcance</h3>
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-light text-slate-650 dark:text-slate-300">
                  {selectedContract.scopeDescription}
                </div>
              </div>

              {/* Scheme and Financials */}
              <div>
                <h3 className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-3">Esquema de Cobro y Entregables</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {milestones.map((m, idx) => (
                    <div key={m.id} className="py-3 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{m.label}</p>
                        <p className="text-2xs text-slate-400">Hito #{idx + 1} • Vence: {new Date(m.dueDate).toLocaleDateString('es-MX')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-slate-900 dark:text-white">{formatMoney(m.amount, selectedContract.currency)}</p>
                        <p className="text-2xs text-indigo-500 capitalize">{m.status === 'confirmed' ? 'Confirmado' : m.status === 'marked_paid' ? 'Reportado' : m.status === 'requested' ? 'Cobro Enviado' : 'Pendiente'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-850 flex justify-between items-center text-base font-extrabold">
                  <span>Monto Total de la Propuesta:</span>
                  <span className="text-indigo-500">{formatMoney(selectedContract.totalAmount, selectedContract.currency)}</span>
                </div>
              </div>

              {/* Legal Clauses */}
              {MOCK_CLAUSES && MOCK_CLAUSES.length > 0 && (
                <div>
                  <h3 className="text-3xs font-bold text-slate-400 uppercase tracking-widest mb-3">Cláusulas de Acuerdo</h3>
                  <div className="flex flex-col gap-4 text-xs font-light text-slate-500 dark:text-slate-400 leading-relaxed">
                    {MOCK_CLAUSES.map((clause, idx) => (
                      <div key={clause.id || idx}>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{idx + 1}. {clause.title}</h4>
                        <p>{clause.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signatures & Seal Box */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-2xs leading-normal">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="font-semibold text-slate-400 uppercase tracking-wider mb-2">Firma Digital (Cliente)</p>
                    {selectedContract.acceptedByName ? (
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white font-serif italic text-sm">{selectedContract.acceptedByName}</p>
                        <p className="text-slate-400 mt-1">Fecha: {new Date(selectedContract.acceptedAt!).toLocaleString('es-MX')}</p>
                        <p className="text-slate-400">IP: {selectedContract.acceptedIp}</p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Pendiente de firma del cliente</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="font-semibold text-slate-400 uppercase tracking-wider mb-2">Contra-firma Digital (Freelancer)</p>
                    {selectedContract.freelancerAcceptedByName ? (
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white font-serif italic text-sm">{selectedContract.freelancerAcceptedByName}</p>
                          <p className="text-slate-400 mt-1">Fecha: {new Date(selectedContract.freelancerAcceptedAt!).toLocaleString('es-MX')}</p>
                          <p className="text-slate-400">IP: {selectedContract.freelancerAcceptedIp}</p>
                        </div>
                        {profile?.signatureUrl && (
                          <img src={profile.signatureUrl} alt="Firma Freelancer" className="max-h-12 object-contain bg-white rounded-lg p-1 border border-slate-100 dark:border-slate-850 dark:bg-slate-900/50" />
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Pendiente de contra-firma del freelancer</p>
                    )}
                  </div>
                </div>

                {selectedContract.contractHash && (
                  <div className="rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/10 p-4 text-2xs leading-relaxed">
                    <p className="font-semibold text-indigo-500 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" />
                      Sello de Integridad del Contrato
                    </p>
                    <p className="font-mono text-slate-650 dark:text-slate-350 select-all mt-1 break-all bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">{selectedContract.contractHash}</p>
                    <p className="text-slate-400 mt-1 font-light">Este hash SHA-256 es un identificador inalterable que une el contenido de la propuesta, los hitos, y las firmas digitales de ambas partes.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditingContract && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-indigo-500/20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 sticky top-0 z-10 rounded-t-3xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-500" />
                Modificar Términos de la Propuesta
              </h3>
              <button
                onClick={() => setIsEditingContract(false)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSaveModification} className="p-6 flex flex-col gap-6 text-left">
              
              {/* Section 1: Client Details */}
              <div className="flex flex-col gap-4">
                <h4 className="text-2xs font-extrabold text-indigo-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5">1. Datos del Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Nombre / Razón Social</label>
                    <input
                      type="text"
                      required
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={editClientEmail}
                      onChange={(e) => setEditClientEmail(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Teléfono de Contacto</label>
                    <input
                      type="text"
                      value={editClientPhone}
                      onChange={(e) => setEditClientPhone(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                      placeholder="Ej. +525512345678"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">RFC Cliente</label>
                    <input
                      type="text"
                      value={editClientRfc}
                      onChange={(e) => setEditClientRfc(e.target.value.toUpperCase())}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white font-mono"
                      placeholder="Ej. GUEH860710MX3"
                      maxLength={13}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Régimen Fiscal</label>
                    <select
                      value={editClientRegimen}
                      onChange={(e) => setEditClientRegimen(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white bg-slate-900"
                    >
                      <option value="">-- Selecciona Régimen --</option>
                      <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
                      <option value="603 - Personas Morales con Fines no Lucrativos">603 - Personas Morales con Fines no Lucrativos</option>
                      <option value="605 - Sueldos y Salarios e Ingresos Asimilados a Salarios">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                      <option value="606 - Arrendamiento">606 - Arrendamiento</option>
                      <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                      <option value="625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas">625 - Régimen de Plataformas</option>
                      <option value="626 - Régimen Simplificado de Confianza (RESICO)">626 - Régimen RESICO</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Código Postal</label>
                    <input
                      type="text"
                      value={editClientPostal}
                      onChange={(e) => setEditClientPostal(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                      placeholder="Ej. 06000"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Scope, Budget, and Taxes */}
              <div className="flex flex-col gap-4">
                <h4 className="text-2xs font-extrabold text-indigo-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5">2. Configuración del Proyecto y Retenciones</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Scope Input */}
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Concepto y Alcance de Trabajo</label>
                    <textarea
                      rows={4}
                      required
                      value={editScopeDescription}
                      onChange={(e) => setEditScopeDescription(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  {/* Budget & Currency */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Presupuesto Total</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          min={1}
                          required
                          value={editTotalAmount || ""}
                          onChange={(e) => handleEditTotalAmountChange(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent pl-6 pr-3 py-1.5 text-xs font-bold focus:border-indigo-500 focus:outline-none dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Moneda</label>
                      <select
                        value={editCurrency}
                        onChange={(e) => setEditCurrency(e.target.value as 'MXN' | 'USD')}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white bg-slate-900 font-bold"
                      >
                        <option value="MXN">Pesos Mexicanos (MXN)</option>
                        <option value="USD">Dólares Americanos (USD)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tax Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-2">
                  <div className="flex flex-col gap-3 bg-slate-100/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase block">Retención de Impuestos (México)</span>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editRetencionIsr}
                          onChange={(e) => setEditRetencionIsr(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        Retención ISR (10% Freelancer)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editRetencionIva}
                          onChange={(e) => setEditRetencionIva(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        Retención IVA (10.667% / 2/3 partes)
                      </label>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="md:col-span-2 bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 flex flex-col gap-2 text-xs">
                    <span className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase block">Desglose Fiscal Estimado</span>
                    <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1 text-slate-650 dark:text-slate-450">
                      <span>Subtotal (Monto del Proyecto):</span>
                      <span className="font-semibold">{formatMoney(editTotalAmount, editCurrency)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800 pb-1 text-slate-650 dark:text-slate-450">
                      <span>IVA Trasladado (16%):</span>
                      <span className="font-semibold">{formatMoney(editTotalAmount * 0.16, editCurrency)}</span>
                    </div>
                    {editRetencionIsr && (
                      <div className="flex justify-between text-red-500 border-b border-slate-200/50 dark:border-slate-800 pb-1">
                        <span>Retención ISR (10%):</span>
                        <span className="font-semibold">-{formatMoney(editTotalAmount * 0.10, editCurrency)}</span>
                      </div>
                    )}
                    {editRetencionIva && (
                      <div className="flex justify-between text-red-500 border-b border-slate-200/50 dark:border-slate-800 pb-1">
                        <span>Retención IVA (10.667%):</span>
                        <span className="font-semibold">-{formatMoney(editTotalAmount * 0.16 * (2 / 3), editCurrency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-800 dark:text-white font-bold pt-1">
                      <span>Neto Estimado a Recibir:</span>
                      <span className="text-indigo-500">
                        {formatMoney(
                          editTotalAmount +
                          (editTotalAmount * 0.16) -
                          (editRetencionIsr ? editTotalAmount * 0.10 : 0) -
                          (editRetencionIva ? editTotalAmount * 0.16 * (2 / 3) : 0),
                          editCurrency
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Milestones Schedule */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <h4 className="text-2xs font-extrabold text-indigo-500 uppercase tracking-wider">3. Esquema de Cobro y Entregables</h4>
                  <button
                    type="button"
                    onClick={handleEditAddMilestone}
                    className="flex items-center gap-1 rounded bg-indigo-550/10 hover:bg-indigo-550/20 text-indigo-500 border border-indigo-500/20 px-2 py-1 text-4xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    + Agregar Hito
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {editMilestones.map((m, idx) => (
                    <div key={m.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-100/30 dark:bg-slate-900/10 border border-slate-200/60 dark:border-slate-900/60 rounded-xl p-3">
                      <div className="sm:col-span-6">
                        <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Concepto del Entregable</label>
                        <input
                          type="text"
                          required
                          value={m.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditMilestones(prev => prev.map((item, i) => i === idx ? { ...item, label: val } : item));
                          }}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                          placeholder="Ej. Anticipo o Entrega final"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Fecha Vencimiento</label>
                        <input
                          type="date"
                          required
                          value={m.dueDate ? m.dueDate.split('T')[0] : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditMilestones(prev => prev.map((item, i) => i === idx ? { ...item, dueDate: val } : item));
                          }}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Importe ({editCurrency})</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3xs font-bold text-slate-400">$</span>
                          <input
                            type="number"
                            required
                            min={1}
                            value={m.amount || ""}
                            onChange={(e) => handleEditMilestoneAmount(idx, Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent pl-5 pr-2 py-1.5 text-xs font-bold focus:border-indigo-500 focus:outline-none dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-1 flex justify-center pb-0.5">
                        <button
                          type="button"
                          onClick={() => handleEditRemoveMilestone(idx)}
                          disabled={editMilestones.length <= 1}
                          className="text-red-500 hover:text-red-600 disabled:opacity-30 p-1.5 rounded bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Milestone Balance Help Message */}
                {(() => {
                  const currentSum = editMilestones.reduce((sum, m) => sum + m.amount, 0);
                  const difference = editTotalAmount - currentSum;
                  if (Math.abs(difference) <= 0.01) {
                    return (
                      <p className="text-3xs text-emerald-500 font-semibold bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-2 mt-1">
                        ¡Balance Correcto! La suma de los hitos coincide con el presupuesto total: {formatMoney(currentSum, editCurrency)}.
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-3xs text-amber-500 font-semibold bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-2 mt-1">
                        Suma Incorrecta: La suma de los hitos es {formatMoney(currentSum, editCurrency)}. {difference > 0 ? "Faltan" : "Exceden"} {formatMoney(Math.abs(difference), editCurrency)} para coincidir con el total de {formatMoney(editTotalAmount, editCurrency)}.
                      </p>
                    );
                  }
                })()}
              </div>

              {/* Section 4: Clauses Checklist */}
              <div className="flex flex-col gap-4">
                <h4 className="text-2xs font-extrabold text-indigo-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5">4. Cláusulas del Acuerdo</h4>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-100/20 dark:bg-slate-900/10">
                  {MOCK_CLAUSES.map((clause) => {
                    const isChecked = editSelectedClauses.includes(clause.id);
                    return (
                      <div
                        key={clause.id}
                        onClick={() => {
                          setEditSelectedClauses(prev =>
                            prev.includes(clause.id)
                              ? prev.filter(id => id !== clause.id)
                              : [...prev, clause.id]
                          );
                        }}
                        className={`flex gap-3 items-start p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 cursor-pointer select-none transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 ${isChecked ? 'bg-indigo-500/5 border-indigo-500/30! ring-1 ring-indigo-500/20' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div onClick
                          className="rounded border-slate-350 dark:border-slate-700 text-indigo-650 focus:ring-indigo-500 mt-0.5 pointer-events-none"
                        />
                        <div className="text-xs">
                          <h5 className="font-bold text-slate-850 dark:text-slate-200">{clause.title} <span className="text-4xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.25 font-normal uppercase ml-1.5">{clause.category}</span></h5>
                          <p className="text-3xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{clause.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Visual Diff Panel */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <span className="text-xs font-bold text-slate-900 dark:text-white block mb-4 uppercase tracking-wider">Comparativa de Cambios (Diff Visual)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Original */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-extrabold text-red-600 uppercase tracking-wider">Versión Original</span>
                      <span className="text-xs font-bold text-red-600 line-through">
                        {formatMoney(selectedContract.totalAmount, selectedContract.currency)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-2">
                      <div><strong className="text-4xs uppercase tracking-wider text-slate-400">Cliente:</strong> {selectedContract.clientName} ({selectedContract.clientEmail})</div>
                      <div><strong className="text-4xs uppercase tracking-wider text-slate-400">Alcance:</strong></div>
                      <div className="whitespace-pre-wrap line-through leading-relaxed">
                        {selectedContract.scopeDescription}
                      </div>
                    </div>
                  </div>

                  {/* Right: Proposed */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-extrabold text-emerald-600 uppercase tracking-wider">Nueva Propuesta</span>
                      <span className="text-xs font-black text-emerald-600">
                        {formatMoney(editTotalAmount, editCurrency)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-800 dark:text-white flex flex-col gap-2">
                      <div><strong className="text-4xs uppercase tracking-wider text-slate-500">Cliente:</strong> {editClientName} ({editClientEmail})</div>
                      <div><strong className="text-4xs uppercase tracking-wider text-slate-500">Alcance:</strong></div>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {editScopeDescription}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingContract(false)}
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Confirmar y Solicitar Firma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Cancellation Modal */}
      {isCancellingContract && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:hidden">
          <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-500/20">
            <h3 className="text-sm font-bold text-red-650 dark:text-red-400 flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5" />
              Cancelar Contrato
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-normal">
              Esta acción dará por terminado el proyecto y cancelará todas las solicitudes de hitos financieros pendientes. Por favor especifica el motivo:
            </p>
            <textarea
              className="w-full rounded-2xl border border-slate-300 dark:border-slate-800 bg-transparent p-3 text-xs focus:border-red-500 focus:outline-none dark:text-white mb-4 resize-none h-24"
              placeholder="Ej. Incumplimiento de entregables, cambio de prioridades..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsCancellingContract(false);
                  setCancelReason("");
                }}
                className="rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleCancelContract}
                disabled={!cancelReason.trim()}
                className="rounded-xl bg-red-600 hover:bg-red-550 text-white font-bold px-4 py-2 text-xs transition-colors shadow-md shadow-red-500/10 disabled:opacity-50 cursor-pointer"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Freelancer Payment Modal */}
      {showPaymentModal && paymentMilestone && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="glass rounded-3xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 text-left bg-white dark:bg-slate-950 shadow-2xl border border-indigo-500/20">
            <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-500">
              <CreditCard className="h-6 w-6" />
              Notificar Transferencia SPEI
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Por favor ingresa la **Clave de Rastreo** de tu transferencia bancaria (se obtiene de tu recibo SPEI, CEP o banca móvil). Esto ayudará al freelancer a asociar tu pago de forma instantánea.
            </p>

            <form onSubmit={handleMarkAsTransferred} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="block text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Clave de Rastreo SPEI / Referencia</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 182746182903485761 o folio"
                  value={trackingReference}
                  onChange={(e) => setTrackingReference(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Monto Transferido ({selectedContract.currency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    required
                    value={transferredAmount}
                    onChange={(e) => setTransferredAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent pl-7 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white font-bold"
                  />
                </div>
              </div>
              {selectedContract.currency === "USD" && (
                <>
                  <div>
                    <label className="block text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tipo de Cambio (Banxico sugerido: 20.15)</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={overrideExchangeRate}
                      onChange={(e) => setOverrideExchangeRate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white font-mono"
                    />
                  </div>

                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3.5 text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between text-slate-400 font-medium">
                      <span>Monto en USD:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">${transferredAmount.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between text-slate-400 font-medium">
                      <span>Tipo de Cambio:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">${(parseFloat(overrideExchangeRate) || 20.15).toFixed(4)} MXN</span>
                    </div>
                    <div className="flex justify-between text-indigo-500 font-bold border-t border-slate-200 dark:border-slate-800/80 pt-2">
                      <span>Total a Transferir:</span>
                      <span>${(transferredAmount * (parseFloat(overrideExchangeRate) || 20.15)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Método de Comprobante
                </label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="receiptFileType"
                      checked={receiptFileType === 'file'}
                      onChange={() => setReceiptFileType('file')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Subir Archivo (PDF, PNG, JPG)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="receiptFileType"
                      checked={receiptFileType === 'url'}
                      onChange={() => setReceiptFileType('url')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Enlace URL
                  </label>
                </div>

                {receiptFileType === 'file' ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id="receipt-file-input"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-xl file:border-0
                        file:text-xs file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100
                        dark:file:bg-indigo-950/30 dark:file:text-indigo-400"
                    />
                    <p className="text-3xs text-slate-400">
                      Formatos permitidos: PDF, PNG, JPG. Máx. 5MB.
                    </p>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Ej. https://dropbox.com/s/recibo.pdf o captura.png"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
                  />
                )}
              </div>

              {modalError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentMilestone(null);
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !trackingReference}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <span>Registrar Pago</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warning/Confirmation Modal */}
      {warningModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="glass rounded-3xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 text-left bg-white dark:bg-slate-950 shadow-2xl border border-indigo-500/20">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${warningModal.isError ? 'text-red-500' : 'text-amber-500'}`}>
              <AlertCircle className="h-6 w-6" />
              {warningModal.title}
            </h3>
            <p className="text-sm text-slate-650 dark:text-slate-350 mt-3 leading-relaxed whitespace-pre-wrap">
              {warningModal.message}
            </p>
            <div className="flex gap-3 justify-end mt-6">
              {warningModal.isError ? (
                <button
                  type="button"
                  onClick={() => setWarningModal(prev => ({ ...prev, isOpen: false }))}
                  className="rounded-xl bg-red-650 hover:bg-red-555 text-white px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setWarningModal(prev => ({ ...prev, isOpen: false }))}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (warningModal.onConfirm) {
                        try {
                          const confirmFn = warningModal.onConfirm;
                          setWarningModal(prev => ({ ...prev, isOpen: false }));
                          await confirmFn();
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : String(err);
                          setWarningModal({
                            isOpen: true,
                            title: "Error de Transición",
                            message: `No se pudo completar la acción: ${msg}`,
                            onConfirm: null,
                            isError: true
                          });
                        }
                      }
                    }}
                    className="rounded-xl bg-amber-600 hover:bg-amber-550 text-white px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Confirmar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
