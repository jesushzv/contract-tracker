"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Printer,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  X
} from "lucide-react";
import { getContractById, getMilestones, acceptContract, markMilestoneAsTransferred, getAuditLogs, getProfile, generateClientOtp, proposeContractRevision, uploadReceiptFile, cancelContract, markContractCompleted, isDemoMode, saveContract, saveMilestones } from "@/lib/storageClient";
import { MOCK_CLAUSES } from "@/lib/mockData";
import { Contract, Milestone, AuditLog, Profile } from "@/lib/types";
import { ClientContractView } from "@/app/components/client/ClientContractView";
import { ClientSigningFlow } from "@/app/components/client/ClientSigningFlow";
import { ClientPaymentUpload } from "@/app/components/client/ClientPaymentUpload";
import { StandingIndicator } from "@/app/components/client/StandingIndicator";

export default function ClientPortalPage() {
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [copiedClabe, setCopiedClabe] = useState(false);
  
  // Modals state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [acceptStep, setAcceptStep] = useState<'name' | 'otp'>('name');
  const [otpInput, setOtpInput] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionSuccess, setRevisionSuccess] = useState(false);

  // States for client editing the contract components
  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editClientRfc, setEditClientRfc] = useState("");
  const [editClientRegimen, setEditClientRegimen] = useState("");
  const [editClientPostal, setEditClientPostal] = useState("");
  const [editScopeDescription, setEditScopeDescription] = useState("");
  const [editTotalAmount, setEditTotalAmount] = useState(0);
  const [editCurrency, setEditCurrency] = useState<'MXN' | 'USD'>("MXN");
  const [editRetencionIsr, setEditRetencionIsr] = useState(false);
  const [editRetencionIva, setEditRetencionIva] = useState(false);
  const [editMilestones, setEditMilestones] = useState<Milestone[]>([]);
  const [editSelectedClauses, setEditSelectedClauses] = useState<string[]>([]);

  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMilestone, setPaymentMilestone] = useState<Milestone | null>(null);
  const [trackingReference, setTrackingReference] = useState("");
  const [transferredAmount, setTransferredAmount] = useState<number>(0);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [receiptFileType, setReceiptFileType] = useState<'file' | 'url'>('file');
  const [receiptFileBase64, setReceiptFileBase64] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [receiptFileMimeType, setReceiptFileMimeType] = useState("");
  const [modalError, setModalError] = useState("");
  const [overrideExchangeRate, setOverrideExchangeRate] = useState("20.15");
  const [accessDenied, setAccessDenied] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastPaidMilestoneLabel, setLastPaidMilestoneLabel] = useState("");
  const [lastPaidMilestoneAmount, setLastPaidMilestoneAmount] = useState(0);

  // Cancellation State
  const [isCancellingContract, setIsCancellingContract] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

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
    async function loadData() {
      if (contractId) {
        setIsVerifyingToken(true);
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get("token");

          const c = await getContractById(contractId);
          if (!c || c.clientAccessToken !== token) {
            setAccessDenied(true);
            setContract(null);
          } else {
            setAccessDenied(false);
            setContract(c);
            const mList = await getMilestones(c.id);
            setMilestones(mList);
            const logs = await getAuditLogs(c.id);
            setAuditLogs(logs);
            
            const prof = await getProfile();
            setProfile(prof);
          }
        } catch (err) {
          console.error("Error loading contract:", err);
          setAccessDenied(true);
        } finally {
          setIsVerifyingToken(false);
        }
      } else {
        setIsVerifyingToken(false);
      }
    }
    loadData();
  }, [contractId]);

  const refreshData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      const c = await getContractById(contractId);
      if (!c || c.clientAccessToken !== token) {
        setAccessDenied(true);
        setContract(null);
      } else {
        setAccessDenied(false);
        setContract(c);
        const mList = await getMilestones(c.id);
        setMilestones(mList);
        const logs = await getAuditLogs(c.id);
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error("Error refreshing contract:", err);
    }
  };

  const handleCopyClabe = () => {
    if (!contract?.clabe) return;
    navigator.clipboard.writeText(contract.clabe);
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2000);
  };

  const handleAcceptContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !signerName) return;
    
    setLoading(true);
    setOtpError("");
    
    try {
      if (acceptStep === 'name') {
        const otp = await generateClientOtp(contractId);
        if (otp) {
          setDebugOtp(otp);
          setAcceptStep('otp');
          setOtpAttempts(0);
        } else {
          setWarningModal({
            isOpen: true,
            title: "Error al generar OTP",
            message: "No se pudo generar el código de verificación OTP.",
            onConfirm: null,
            isError: true
          });
        }
        setLoading(false);
      } else {
        setLoading(false);
        if (otpAttempts >= 3) {
          throw new Error("Límite de intentos OTP excedido. Genera un nuevo código.");
        }

        const isOtpCorrect = !isDemoMode() || (otpInput === debugOtp);
        if (!isOtpCorrect) {
          const nextAttempts = otpAttempts + 1;
          setOtpAttempts(nextAttempts);
          let errMsg = "";
          if (nextAttempts >= 3) {
            errMsg = "Has alcanzado el límite de 3 intentos fallidos. Por motivos de seguridad, este intento se ha bloqueado. Por favor, genera un nuevo código OTP.";
          } else {
            errMsg = `El código de verificación ingresado es incorrecto. Intentos restantes: ${3 - nextAttempts}`;
          }
          setOtpError(errMsg);
          return;
        }

        const executeAccept = async () => {
          setLoading(true);
          try {
            const updated = await acceptContract(contractId, signerName, otpInput);
            if (updated) {
              setContract(updated);
              const mList = await getMilestones(contractId);
              setMilestones(mList);
              const logs = await getAuditLogs(contractId);
              setAuditLogs(logs);
              setAcceptedSuccess(true);
              setAcceptStep('name');
              setOtpInput("");
              setDebugOtp(null);
              setShowAcceptModal(false);
              setOtpAttempts(0);
              setTimeout(() => setAcceptedSuccess(false), 5050);
            }
          } catch (err) {
            const error = err as Error;
            const nextAttempts = otpAttempts + 1;
            setOtpAttempts(nextAttempts);
            let errMsg = "";
            if (nextAttempts >= 3) {
              errMsg = "Has alcanzado el límite de 3 intentos fallidos. Por motivos de seguridad, este intento se ha bloqueado. Por favor, genera un nuevo código OTP.";
            } else {
              errMsg = `${error.message || "Código incorrecto."} Intentos restantes: ${3 - nextAttempts}`;
            }
            setOtpError(errMsg);
          } finally {
            setLoading(false);
          }
        };

        setWarningModal({
          isOpen: true,
          title: "Firmar Contrato",
          message: `¿Estás seguro de que deseas firmar digitalmente el contrato como "${signerName}"? Esta acción confirmará tu aceptación de todos los términos y condiciones.`,
          onConfirm: executeAccept,
          isError: false
        });
      }
    } catch (err) {
      const error = err as Error;
      setWarningModal({
        isOpen: true,
        title: "Error de Firma",
        message: error.message,
        onConfirm: null,
        isError: true
      });
      setLoading(false);
    }
  };

  const handleRegenerateOtp = async () => {
    setLoading(true);
    setOtpError("");
    try {
      const otp = await generateClientOtp(contractId);
      if (otp) {
        setDebugOtp(otp);
        setOtpAttempts(0);
        setOtpInput("");
      } else {
        setWarningModal({
          isOpen: true,
          title: "Error de Generación OTP",
          message: "No se pudo generar el código de verificación OTP.",
          onConfirm: null,
          isError: true
        });
      }
    } catch (err) {
      setWarningModal({
        isOpen: true,
        title: "Error al regenerar OTP",
        message: err instanceof Error ? err.message : String(err),
        onConfirm: null,
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelContract = async () => {
    if (!contractId || !cancelReason.trim()) return;

    const executeCancel = async () => {
      try {
        await cancelContract(contractId, "client", cancelReason);
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
    if (!contractId) return;

    const executeComplete = async () => {
      try {
        await markContractCompleted(contractId, "client");
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

  const startProposingRevision = () => {
    if (!contract) return;
    setEditClientName(contract.clientName);
    setEditClientEmail(contract.clientEmail);
    setEditClientPhone(contract.clientPhone || "");
    setEditClientRfc(contract.clientRfc || "");
    setEditClientRegimen(contract.clientRegimen || "");
    setEditClientPostal(contract.clientPostal || "");
    setEditScopeDescription(contract.scopeDescription);
    setEditTotalAmount(contract.totalAmount);
    setEditCurrency(contract.currency);
    setEditRetencionIsr(!!contract.retencionIsr);
    setEditRetencionIva(!!contract.retencionIva);
    setEditMilestones(milestones.map(m => ({ ...m })));
    setEditSelectedClauses(contract.selectedClauses || []);
    setRevisionReason("");
    setShowRevisionModal(true);
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
        contractId: contract?.id || "",
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

  const handleProposeRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractId || !revisionReason || !contract) return;

    // Validate milestone sums
    const milestoneSum = editMilestones.reduce((sum, m) => sum + m.amount, 0);
    if (Math.abs(milestoneSum - editTotalAmount) > 0.01) {
      alert(`La suma de los hitos (${milestoneSum} ${editCurrency}) debe ser exactamente igual al monto total del contrato (${editTotalAmount} ${editCurrency}). Por favor, ajusta los importes de tus hitos.`);
      return;
    }

    const executeProposeRevision = async () => {
      setLoading(true);
      try {
        const total = editTotalAmount;
        const subtotalAmount = total;
        const taxWithholdingAmount = (editRetencionIsr ? total * 0.10 : 0) + (editRetencionIva ? total * 0.16 * (2 / 3) : 0);
        const ivaAmount = total * 0.16;

        const updatedContract: Contract = {
          ...contract,
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
          status: 'draft',
          acceptedAt: undefined,
          acceptedByName: undefined,
          acceptedIp: undefined,
          freelancerAcceptedAt: undefined,
          freelancerAcceptedByName: undefined,
          freelancerAcceptedIp: undefined,
          contractHash: undefined
        };

        // Ensure newly added milestones have secure UUIDs
        const finalMilestones = editMilestones.map((m) => {
          const finalId = m.id.startsWith("new-") ? (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          })) : m.id;
          return {
            ...m,
            id: finalId,
            contractId: contract.id
          };
        });

        await saveContract(updatedContract);
        await saveMilestones(finalMilestones);

        // Call storage API to register proposal with status draft and log revision
        const updated = await proposeContractRevision(contractId, `${revisionReason} (Cambios de componentes guardados)`);
        if (updated) {
          setContract(updated);
          await refreshData();
          setShowRevisionModal(false);
          setRevisionReason("");
          setRevisionSuccess(true);
          setTimeout(() => setRevisionSuccess(false), 5050);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setWarningModal({
          isOpen: true,
          title: "Error al Solicitar Revisión",
          message: `No se pudo solicitar la revisión: ${msg}`,
          onConfirm: null,
          isError: true
        });
      } finally {
        setLoading(false);
      }
    };

    setWarningModal({
      isOpen: true,
      title: "Solicitar Revisión de Contrato",
      message: "¿Estás seguro de que deseas proponer estos cambios y solicitar una revisión? El contrato volverá a estado de borrador con tus términos actualizados.",
      onConfirm: executeProposeRevision,
      isError: false
    });
  };



  const handlePrint = () => {
    window.print();
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

  if (isVerifyingToken) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-24 text-center">
        <div className="glass rounded-3xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
          <h1 className="text-xl font-bold">Verificando Acceso...</h1>
          <p className="text-sm text-slate-500">
            Validando tus credenciales de acceso seguro.
          </p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-24 text-center">
        <div className="glass rounded-3xl p-8 flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h1 className="text-xl font-bold">Acceso Restringido</h1>
          <p className="text-sm text-slate-500">
            El enlace que ingresaste no es válido, no tiene el token de acceso requerido o ha expirado.
          </p>
          <Link 
            href="/"
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Ir a Inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-24 text-center">
        <div className="glass rounded-3xl p-8 flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h1 className="text-xl font-bold">Contrato No Encontrado</h1>
          <p className="text-sm text-slate-500">
            El contrato no pudo ser localizado o fue eliminado.
          </p>
          <Link 
            href="/"
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Ir a Inicio
          </Link>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setModalError("");
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

  const handleMarkAsTransferred = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMilestone || !trackingReference) return;
    
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
      const mxnSum = contract.currency === "USD" ? (transferredAmount * fxRate) : undefined;

      setLastPaidMilestoneLabel(paymentMilestone.label);
      setLastPaidMilestoneAmount(transferredAmount);

      await markMilestoneAsTransferred(
        paymentMilestone.id,
        trackingReference,
        transferredAmount,
        resolvedReceiptUrl,
        contract.currency === "USD" ? fxRate : undefined,
        mxnSum
      );
      await refreshData();
      setShowPaymentModal(false);
      setPaymentMilestone(null);
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 8000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar referencia de transferencia.";
      setModalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const tokenPart = contract?.clientAccessToken ? `?token=${contract.clientAccessToken}` : "";
  const demoPart = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get("demo") === "true" ? "&demo=true" : "";
  const clientUrl = typeof window !== 'undefined' ? `${window.location.origin}/c/${contract?.id}${tokenPart}${demoPart}` : "";
  const cleanFreelancerPhone = profile?.phone ? profile.phone.replace(/\D/g, "") : "";

  const getFreelancerWaLink = (text: string) => {
    if (cleanFreelancerPhone) return `https://wa.me/${cleanFreelancerPhone}?text=${encodeURIComponent(text)}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Find active requested payments
  const activePayment = milestones.find(m => m.status === 'requested');

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-6 print:p-0 print:max-w-full">
      {/* Banner message at the top */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vista del Cliente</span>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 :bg-slate-800 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir / Descargar PDF
          </button>
          
          {contract.status === 'sent' && (
            <>
              <button
                onClick={() => setShowAcceptModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                Revisar y Firmar Aceptación
              </button>
              <button
                onClick={startProposingRevision}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-205 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
              >
                Solicitar Revisión
              </button>
            </>
          )}

          {contract.status === 'client_signed' && (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2.5 text-xs font-semibold text-purple-700">
                <Clock className="h-4 w-4" />
                Esperando Validación Final
              </div>
              <button
                onClick={startProposingRevision}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-205 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
              >
                Solicitar Revisión
              </button>
            </div>
          )}

          {contract.status === 'accepted' && (
            <button
              onClick={startProposingRevision}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-205 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
            >
              Solicitar Revisión
            </button>
          )}
        </div>
      </div>

      {/* Accepted success notification banner */}
      {acceptedSuccess && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 flex items-start justify-between gap-3 print:hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">¡Contrato firmado exitosamente!</span>
              <p className="text-xs mt-1 text-slate-500">
                Hemos registrado tu firma electrónica. El contrato se encuentra ahora en revisión final por parte del freelancer.
              </p>
            </div>
          </div>
          <a
            href={getFreelancerWaLink(`Hola ${profile?.fullName || 'Freelancer'}, ya firmé el contrato digitalmente. Por favor, revísalo y valídalo aquí: ${clientUrl}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-3 py-1.5 transition-all flex items-center gap-1"
          >
            Notificar por WhatsApp
          </a>
        </div>
      )}

      {/* Revision proposed success banner */}
      {revisionSuccess && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-850 flex items-start justify-between gap-3 print:hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold">Solicitud de revisión enviada</span>
              <p className="text-xs mt-1 text-slate-500">
                Hemos notificado al freelancer. El contrato ha vuelto a estado de borrador para su edición.
              </p>
            </div>
          </div>
          <a
            href={getFreelancerWaLink(`Hola ${profile?.fullName || 'Freelancer'}, solicité una revisión al contrato. Motivo: ${revisionReason}. Podemos ajustarlo aquí: ${clientUrl}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-3 py-1.5 transition-all flex items-center gap-1"
          >
            Notificar por WhatsApp
          </a>
        </div>
      )}

      {/* Payment reported success banner */}
      {paymentSuccess && (
        <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 text-sm text-indigo-800 flex items-start justify-between gap-3 print:hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">¡Pago reportado exitosamente!</span>
              <p className="text-xs mt-1 text-slate-500">
                Tu transferencia para el hito &ldquo;{lastPaidMilestoneLabel}&rdquo; por {formatMoney(lastPaidMilestoneAmount, contract.currency)} ha sido enviada para verificación.
              </p>
            </div>
          </div>
          <a
            href={getFreelancerWaLink(`Hola ${profile?.fullName || 'Freelancer'}, ya realicé la transferencia de ${formatMoney(lastPaidMilestoneAmount, contract.currency)} para el hito '${lastPaidMilestoneLabel}'. Adjunté el comprobante para tu validación: ${clientUrl}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-3 py-1.5 transition-all flex items-center gap-1"
          >
            Notificar por WhatsApp
          </a>
        </div>
      )}

      {/* Main Grid: Document & Financial Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: The actual Contract Paper (printable) */}
        <ClientContractView
          contract={contract}
          profile={profile}
          auditLogs={auditLogs}
          startProposingRevision={startProposingRevision}
        />

        <div className="lg:col-span-4 flex flex-col gap-6 print:hidden">
          {/* Freelancer Reputation / Standing Card */}
          <StandingIndicator freelancerRfc={contract.freelancerRfc} />

          {/* SPEI bank details card */}
          <div className="glass rounded-3xl p-5 border-indigo-500/20 bg-white/70 flex flex-col gap-4 text-left">
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-indigo-500">
              <Briefcase className="h-4 w-4" />
              Detalles Financieros del Proyecto
            </h3>
            
            <div className="flex flex-col gap-2">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Total Acordado</span>
              <span className="text-3xl font-black text-slate-900">
                {formatMoney(contract.totalAmount, contract.currency)}
              </span>
            </div>

            {contract.clabe && (
              <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Información para Transferir (SPEI)</span>
                
                <div className="bg-slate-50 rounded-xl p-3.5 flex flex-col gap-2 border border-slate-100">
                  <div className="text-xs">
                    <span className="text-slate-400 font-light block">Titular:</span>
                    <span className="font-semibold text-slate-800">{contract.beneficiaryName}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400 font-light block">Banco:</span>
                    <span className="font-semibold text-slate-800">{contract.bankName}</span>
                  </div>
                  <div className="text-xs flex items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-400 font-light block">CLABE Interbancaria:</span>
                      <span className="font-mono font-bold text-sm text-slate-900 tracking-wide">{contract.clabe}</span>
                    </div>
                    <button 
                      onClick={handleCopyClabe}
                      className="text-slate-400 hover:text-indigo-500 transition-colors p-1"
                      title="Copiar CLABE"
                    >
                      {copiedClabe ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {contract.status === 'accepted' && (
            <div className="glass rounded-3xl p-5 border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-4 text-left">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Entrega y Finalización del Proyecto
              </h3>
              <p className="text-2xs text-slate-500 leading-normal">
                Si el freelancer ha completado la entrega de los servicios/productos acordados, puedes marcar tu confirmación de conformidad a continuación.
              </p>
              
              <div className="flex flex-col gap-2">
                {contract.clientCompletedAt ? (
                  <div className="text-xs text-amber-600 font-bold flex items-center gap-1.5">
                    <span className="animate-pulse h-2 w-2 rounded-full bg-amber-500"></span>
                    Has confirmado la entrega. Esperando que el freelancer confirme por su parte para cerrar el contrato.
                  </div>
                ) : (
                  <button
                    onClick={handleMarkCompleted}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 text-xs transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    Confirmar Proyecto como Terminado / Recibido
                  </button>
                )}

                <button
                  onClick={() => setIsCancellingContract(true)}
                  className="w-full rounded-xl border border-red-200 hover:bg-red-50 :bg-red-950/20 text-red-650 font-semibold py-2.5 text-xs transition-colors cursor-pointer"
                >
                  Cancelar Contrato (Detener Proyecto)
                </button>
              </div>
            </div>
          )}

          {/* Active invoice request */}
          {activePayment && contract.status === 'accepted' ? (
            <div className="glass rounded-3xl p-5 border-amber-500/20 bg-amber-500/5 flex flex-col gap-4 text-left animate-pulse-subtle">
              <h4 className="text-xs font-extrabold uppercase text-amber-600 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Pago Solicitado / En Espera
              </h4>
              <div>
                <p className="text-sm font-bold text-slate-800">{activePayment.label}</p>
                <p className="text-2xs text-slate-400 mt-0.5">Vence: {new Date(activePayment.dueDate).toLocaleDateString('es-MX')}</p>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-slate-400 text-xs">Monto a pagar:</span>
                <span className="text-xl font-extrabold text-slate-900">
                  {formatMoney(activePayment.amount, contract.currency)}
                </span>
              </div>
              
              <button
                onClick={() => handleOpenPaymentModal(activePayment)}
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 text-xs transition-colors flex items-center justify-center gap-1 shadow-lg shadow-amber-500/10"
              >
                Ya transferí por SPEI
              </button>
            </div>
          ) : activePayment ? (
            <div className="glass rounded-3xl p-5 border-slate-200 bg-slate-50/50 flex flex-col gap-2 text-left">
              <h4 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Hito Inicial Pendiente
              </h4>
              <p className="text-3xs text-slate-400 leading-relaxed font-light">
                Los pagos de hitos se habilitarán en cuanto el contrato sea formalmente sellado por ambas partes.
              </p>
            </div>
          ) : null}

          {/* Milestones chronology sidebar */}
          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calendario de Hitos</h4>
              {['sent', 'client_signed', 'accepted'].includes(contract.status) && (
                <button
                  onClick={startProposingRevision}
                  className="text-5xs font-extrabold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 uppercase transition-colors cursor-pointer"
                  title="Proponer cambios a hitos y presupuesto"
                >
                  <Edit3 className="h-2.5 w-2.5" />
                  Editar
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {milestones.map((m, idx) => {
                const overdue = isMilestoneOverdue(m);
                return (
                  <div 
                    key={m.id}
                    className="glass rounded-2xl p-4 flex justify-between items-center border-l-4 border-l-slate-300 data-[status=marked_paid]:border-l-emerald-500 data-[status=confirmed]:border-l-indigo-500 data-[status=requested]:border-l-amber-500 data-[overdue=true]:border-l-red-500"
                    data-status={m.status}
                    data-overdue={overdue}
                  >
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                        {m.label}
                        {overdue && (
                          <span className="bg-red-550/15 border border-red-500/20 rounded px-1 py-0.25 text-4xs font-bold text-red-500 uppercase animate-pulse">
                            Atrasado
                          </span>
                        )}
                      </h5>
                      <span className="text-3xs text-slate-400">Hito #{idx + 1} • Vence: {new Date(m.dueDate).toLocaleDateString('es-MX')}</span>
                      {m.receiptUrl && (
                        <div className="mt-1.5 flex items-center gap-1.5 print:hidden">
                          <a 
                            href={m.receiptUrl.startsWith('http') ? m.receiptUrl : `https://${m.receiptUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-3xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver comprobante
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-xs text-slate-800">{formatMoney(m.amount, contract.currency)}</p>
                      <span className={`text-4xs font-bold uppercase ${ m.status === 'confirmed' ? 'text-indigo-500' : m.status === 'marked_paid' ? 'text-emerald-500' : m.status === 'requested' ? 'text-amber-500' : 'text-slate-400' }`}>
                        {m.status === 'pending' ? 'pendiente' : m.status === 'requested' ? 'solicitado' : m.status === 'marked_paid' ? 'verificando' : 'confirmado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SPEI Payment Reference Input Modal Dialog */}
      {showPaymentModal && paymentMilestone && (
        <ClientPaymentUpload
          showPaymentModal={showPaymentModal}
          setShowPaymentModal={setShowPaymentModal}
          paymentMilestone={paymentMilestone}
          setPaymentMilestone={setPaymentMilestone}
          contract={contract}
          handleMarkAsTransferred={handleMarkAsTransferred}
          trackingReference={trackingReference}
          setTrackingReference={setTrackingReference}
          transferredAmount={transferredAmount}
          setTransferredAmount={setTransferredAmount}
          overrideExchangeRate={overrideExchangeRate}
          setOverrideExchangeRate={setOverrideExchangeRate}
          receiptFileType={receiptFileType}
          setReceiptFileType={setReceiptFileType}
          receiptUrl={receiptUrl}
          setReceiptUrl={setReceiptUrl}
          receiptFileName={receiptFileName}
          handleFileChange={handleFileChange}
          modalError={modalError}
          loading={loading}
        />
      )}

      {/* Acceptance Modal Dialog */}
      {showAcceptModal && (
        <ClientSigningFlow
          showAcceptModal={showAcceptModal}
          setShowAcceptModal={setShowAcceptModal}
          acceptStep={acceptStep}
          setAcceptStep={setAcceptStep}
          signerName={signerName}
          setSignerName={setSignerName}
          otpInput={otpInput}
          setOtpInput={setOtpInput}
          handleAcceptContract={handleAcceptContract}
          debugOtp={debugOtp}
          otpError={otpError}
          otpAttempts={otpAttempts}
          handleRegenerateOtp={handleRegenerateOtp}
          loading={loading}
          contract={contract}
        />
      )}

      {showRevisionModal && contract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto print:hidden">
          <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-rose-500/20 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 bg-white sticky top-0 z-10 rounded-t-3xl">
              <h3 className="font-extrabold text-rose-600 flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 animate-pulse text-rose-500" />
                Proponer Cambios y Solicitar Revisión
              </h3>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 :bg-slate-900 text-slate-400 hover:text-slate-700 :text-slate-300 transition-colors z-20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleProposeRevision} className="p-6 flex flex-col gap-6 text-left">
              
              {/* Section 1: Client Details */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-rose-650 uppercase tracking-wider border-b border-slate-200 pb-2">1. Tus Datos de Facturación (Cliente)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Nombre / Razón Social</label>
                    <input
                      type="text"
                      required
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      className="rounded-xl border border-slate-350 bg-transparent px-3 py-2 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all duration-300"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={editClientEmail}
                      onChange={(e) => setEditClientEmail(e.target.value)}
                      className="rounded-xl border border-slate-355 bg-transparent px-3 py-2 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all duration-300"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Teléfono de Contacto</label>
                    <input
                      type="text"
                      value={editClientPhone}
                      onChange={(e) => setEditClientPhone(e.target.value)}
                      className="rounded-xl border border-slate-355 bg-transparent px-3 py-2 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all duration-300"
                      placeholder="Ej. +525512345678"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Tu RFC</label>
                    <input
                      type="text"
                      value={editClientRfc}
                      onChange={(e) => setEditClientRfc(e.target.value.toUpperCase())}
                      className="rounded-xl border border-slate-355 bg-transparent px-3 py-2 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none font-mono transition-all duration-300"
                      placeholder="Ej. GUEH860710MX3"
                      maxLength={13}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Régimen Fiscal</label>
                    <select
                      value={editClientRegimen}
                      onChange={(e) => setEditClientRegimen(e.target.value)}
                      className="rounded-xl border border-slate-355 bg-transparent px-3 py-2 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none bg-slate-900 transition-all duration-300"
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
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Código Postal</label>
                    <input
                      type="text"
                      value={editClientPostal}
                      onChange={(e) => setEditClientPostal(e.target.value)}
                      className="rounded-xl border border-slate-355 bg-transparent px-3 py-2 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all duration-300"
                      placeholder="Ej. 06000"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Scope, Budget, and Taxes */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-rose-650 uppercase tracking-wider border-b border-slate-200 pb-2">2. Configuración del Proyecto y Retenciones</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Scope Input */}
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Concepto y Alcance de Trabajo</label>
                    <textarea
                      rows={4}
                      required
                      value={editScopeDescription}
                      onChange={(e) => setEditScopeDescription(e.target.value)}
                      className="rounded-xl border border-slate-355 bg-transparent px-4 py-2.5 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all duration-300"
                    />
                  </div>

                  {/* Budget & Currency */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Presupuesto Total</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          min={1}
                          required
                          value={editTotalAmount || ""}
                          onChange={(e) => handleEditTotalAmountChange(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-355 bg-transparent pl-6 pr-3 py-2 text-xs font-bold focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all duration-300"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Moneda</label>
                      <select
                        value={editCurrency}
                        onChange={(e) => setEditCurrency(e.target.value as 'MXN' | 'USD')}
                        className="rounded-xl border border-slate-355 bg-transparent px-3 py-2 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none bg-slate-900 font-bold transition-all duration-300"
                      >
                        <option value="MXN">Pesos Mexicanos (MXN)</option>
                        <option value="USD">Dólares Americanos (USD)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tax Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-2">
                  <div className="flex flex-col gap-3 bg-slate-100/50 p-4 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Retención de Impuestos (México)</span>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs text-slate-750 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editRetencionIsr}
                          onChange={(e) => setEditRetencionIsr(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                        />
                        Retención ISR (10% Freelancer)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-750 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editRetencionIva}
                          onChange={(e) => setEditRetencionIva(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500"
                        />
                        Retención IVA (10.667% / 2/3 partes)
                      </label>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="md:col-span-2 bg-rose-500/5 p-4 rounded-xl border border-rose-500/10 flex flex-col gap-2 text-xs">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-550 mb-1 block">Desglose Fiscal Estimado</span>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1 text-slate-650">
                      <span>Subtotal (Monto del Proyecto):</span>
                      <span className="font-semibold">{formatMoney(editTotalAmount, editCurrency)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1 text-slate-650">
                      <span>IVA Trasladado (16%):</span>
                      <span className="font-semibold">{formatMoney(editTotalAmount * 0.16, editCurrency)}</span>
                    </div>
                    {editRetencionIsr && (
                      <div className="flex justify-between text-rose-600 border-b border-slate-200/50 pb-1">
                        <span>Retención ISR (10%):</span>
                        <span className="font-semibold">-{formatMoney(editTotalAmount * 0.10, editCurrency)}</span>
                      </div>
                    )}
                    {editRetencionIva && (
                      <div className="flex justify-between text-rose-600 border-b border-slate-200/50 pb-1">
                        <span>Retención IVA (10.667%):</span>
                        <span className="font-semibold">-{formatMoney(editTotalAmount * 0.16 * (2 / 3), editCurrency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-800 font-bold pt-1">
                      <span>Neto Estimado a Recibir:</span>
                      <span className="text-rose-600">
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
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold text-rose-650 uppercase tracking-wider">3. Esquema de Cobro y Entregables</h4>
                  <button
                    type="button"
                    onClick={handleEditAddMilestone}
                    className="flex items-center gap-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 px-3 py-1 text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    + Agregar Hito
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {editMilestones.map((m, idx) => (
                    <div key={m.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-100/30 border border-slate-200/60 rounded-xl p-3">
                      <div className="sm:col-span-6">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Concepto del Entregable</label>
                        <input
                          type="text"
                          required
                          value={m.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditMilestones(prev => prev.map((item, i) => i === idx ? { ...item, label: val } : item));
                          }}
                          className="w-full rounded-xl border border-slate-350 bg-transparent px-3 py-2 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all duration-300"
                          placeholder="Ej. Anticipo o Entrega final"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Fecha Vencimiento</label>
                        <input
                          type="date"
                          required
                          value={m.dueDate ? m.dueDate.split('T')[0] : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditMilestones(prev => prev.map((item, i) => i === idx ? { ...item, dueDate: val } : item));
                          }}
                          className="w-full rounded-xl border border-slate-355 bg-transparent px-3 py-2 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all duration-300"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Importe ({editCurrency})</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                          <input
                            type="number"
                            required
                            min={1}
                            value={m.amount || ""}
                            onChange={(e) => handleEditMilestoneAmount(idx, Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-355 bg-transparent pl-5 pr-2 py-2 text-xs font-bold focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all duration-300"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-1 flex justify-center pb-0.5">
                        <button
                          type="button"
                          onClick={() => handleEditRemoveMilestone(idx)}
                          disabled={editMilestones.length <= 1}
                          className="text-rose-500 hover:text-rose-600 disabled:opacity-30 p-2 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 transition-colors cursor-pointer text-xs font-semibold"
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
                      <p className="text-xs text-emerald-600 font-semibold bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-2 mt-1">
                        ¡Balance Correcto! La suma de los hitos coincide con el presupuesto total: {formatMoney(currentSum, editCurrency)}.
                      </p>
                    );
                  } else {
                    return (
                      <p className="text-xs text-amber-600 font-semibold bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-2 mt-1">
                        Suma Incorrecta: La suma de los hitos es {formatMoney(currentSum, editCurrency)}. {difference > 0 ? "Faltan" : "Exceden"} {formatMoney(Math.abs(difference), editCurrency)} para coincidir con el total de {formatMoney(editTotalAmount, editCurrency)}.
                      </p>
                    );
                  }
                })()}
              </div>

              {/* Section 4: Clauses Checklist */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-rose-650 uppercase tracking-wider border-b border-slate-200 pb-2">4. Cláusulas del Acuerdo</h4>
                <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto border border-slate-200 rounded-xl p-3.5 bg-slate-100/20">
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
                        className={`flex gap-3 items-start p-3 rounded-xl border border-slate-200 cursor-pointer select-none transition-colors hover:bg-slate-50 :bg-slate-900/50 ${isChecked ? 'bg-rose-500/5 border-rose-500/30! ring-1 ring-rose-500/20' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div onClick
                          className="rounded border-slate-355 text-rose-500 focus:ring-rose-500 mt-0.5 pointer-events-none"
                        />
                        <div className="text-xs">
                          <h5 className="font-bold text-slate-850">{clause.title} <span className="text-[10px] text-slate-500 bg-slate-100 rounded px-2 py-0.5 font-semibold uppercase ml-2">{clause.category}</span></h5>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{clause.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 5: Revision Reason */}
              <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-6">
                <h4 className="text-xs font-bold text-rose-650 uppercase tracking-wider pb-2">5. Comentarios de la Revisión (Requerido)</h4>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Explica los motivos de estos cambios al freelancer</label>
                <div className="relative">
                  <textarea
                    required
                    rows={3}
                    maxLength={1000}
                    placeholder="Ej. Favor de corregir el monto de los hitos y modificar el alcance del proyecto de acuerdo a lo platicado..."
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    className="w-full rounded-2xl border border-slate-350 bg-slate-50/50 px-4 py-3 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 resize-none"
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] font-semibold text-slate-400 select-none">
                    {revisionReason.length}/1000
                  </span>
                </div>
              </div>

              {/* Visual Diff Panel */}
              <div className="border-t border-slate-200 pt-6">
                <span className="text-xs font-bold text-slate-900 block mb-4 uppercase tracking-wider">Comparativa de Cambios (Diff Visual)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Original */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-extrabold text-red-600 uppercase tracking-wider">Versión Original</span>
                      <span className="text-xs font-bold text-red-600 line-through">
                        {formatMoney(contract.totalAmount, contract.currency)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-650 flex flex-col gap-2">
                      <div><strong className="text-4xs uppercase tracking-wider text-slate-400">Cliente:</strong> {contract.clientName} ({contract.clientEmail})</div>
                      <div><strong className="text-4xs uppercase tracking-wider text-slate-400">Alcance:</strong></div>
                      <div className="whitespace-pre-wrap line-through leading-relaxed">
                        {contract.scopeDescription}
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
                    <div className="text-xs text-slate-850 flex flex-col gap-2">
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
              <div className="border-t border-slate-200 pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 :bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !revisionReason}
                  className="rounded-xl bg-red-650 hover:bg-red-600 disabled:opacity-50 text-white px-6 py-2.5 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/10 cursor-pointer"
                >
                  {loading ? "Procesando..." : "Proponer Cambios y Solicitar Revisión"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isCancellingContract && contract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md print:hidden">
          <div className="relative glass rounded-3xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 text-left bg-white shadow-2xl border border-rose-500/20">
            <button
              type="button"
              onClick={() => {
                setIsCancellingContract(false);
                setCancelReason("");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 :bg-slate-900 text-slate-400 hover:text-slate-700 :text-slate-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-6 w-6 text-rose-500 animate-pulse" />
              Cancelar Contrato
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Ingresa el motivo de cancelación del contrato. Se notificará al freelancer y quedará registrado en la bitácora de auditoría.
            </p>

            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Motivo de Cancelación</label>
                <div className="relative">
                  <textarea
                    rows={4}
                    required
                    maxLength={500}
                    placeholder="Ej. Mutuo acuerdo, cambio de proveedor, etc..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full rounded-2xl border border-slate-350 bg-slate-50/50 px-4 py-3 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 focus:outline-none transition-all duration-300 resize-none"
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] font-semibold text-slate-400 select-none">
                    {cancelReason.length}/500
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCancellingContract(false);
                    setCancelReason("");
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 :text-slate-200 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleCancelContract}
                  disabled={!cancelReason.trim()}
                  className="rounded-xl bg-rose-650 hover:bg-rose-600 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-600/10"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning/Confirmation Modal */}
      {warningModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md print:hidden">
          <div className={`relative glass rounded-3xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 text-left bg-white shadow-2xl border ${warningModal.isError ? 'border-red-500/20' : 'border-amber-500/20'}`}>
            <button
              type="button"
              onClick={() => setWarningModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 :bg-slate-900 text-slate-400 hover:text-slate-700 :text-slate-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className={`text-xl font-bold flex items-center gap-2 ${warningModal.isError ? 'text-red-500' : 'text-amber-500'}`}>
              <AlertTriangle className={`h-6 w-6 ${warningModal.isError ? 'text-red-500 animate-pulse' : 'text-amber-500 animate-pulse'}`} />
              {warningModal.title}
            </h3>
            <p className="text-xs text-slate-650 mt-3 leading-relaxed whitespace-pre-wrap">
              {warningModal.message}
            </p>
            <div className="flex gap-3 justify-end mt-6">
              {warningModal.isError ? (
                <button
                  type="button"
                  onClick={() => setWarningModal(prev => ({ ...prev, isOpen: false }))}
                  className="rounded-xl bg-red-650 hover:bg-red-600 text-white px-5 py-2.5 text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-red-600/10"
                >
                  Entendido
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setWarningModal(prev => ({ ...prev, isOpen: false }))}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 :text-slate-200 transition-colors"
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
                    className="rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-amber-600/10"
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

