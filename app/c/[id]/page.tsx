"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Copy, 
  AlertCircle,
  Briefcase,
  Printer,
  CreditCard,
  ExternalLink,
  Loader2,
  Star
} from "lucide-react";
import { getContractById, getMilestones, acceptContract, markMilestoneAsTransferred, getAuditLogs, getProfile, generateClientOtp, proposeContractRevision, uploadReceiptFile, cancelContract, markContractCompleted, isDemoMode, saveContract, saveMilestones } from "@/lib/storageClient";
import { MOCK_CLAUSES } from "@/lib/mockData";
import { Contract, Milestone, AuditLog, Profile } from "@/lib/types";

export default function ClientContractView() {
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-205 bg-red-50 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 px-3.5 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
              >
                Solicitar Revisión
              </button>
            </>
          )}

          {contract.status === 'client_signed' && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20">
              <Clock className="h-4 w-4" />
              Esperando Validación Final
            </div>
          )}
        </div>
      </div>

      {/* Accepted success notification banner */}
      {acceptedSuccess && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-400 flex items-start justify-between gap-3 print:hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">¡Contrato firmado exitosamente!</span>
              <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
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
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-850 dark:text-amber-400 flex items-start justify-between gap-3 print:hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold">Solicitud de revisión enviada</span>
              <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
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
        <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 text-sm text-indigo-800 dark:text-indigo-400 flex items-start justify-between gap-3 print:hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">¡Pago reportado exitosamente!</span>
              <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
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
        <div className="lg:col-span-8 bg-white dark:bg-slate-950 shadow-md border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 md:p-8 text-left print:shadow-none print:border-none print:p-0">
          
          {/* Header document representation */}
          <div className="flex flex-col gap-6 pb-6 border-b border-slate-100 dark:border-slate-900">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                {profile?.logoUrl && (
                  <img src={profile.logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-xl border border-slate-100 dark:border-slate-800 bg-white" />
                )}
                <div>
                  <h1 className="text-2xl font-black uppercase text-slate-800 dark:text-white tracking-tight">Propuesta de Contrato</h1>
                  <p className="text-xs text-slate-400 font-mono mt-1">ID: {contract.id.substring(0, 18)}</p>
                </div>
              </div>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase ring-1 ring-inset ${
                contract.status === 'accepted'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : contract.status === 'completed'
                  ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400'
                  : contract.status === 'client_signed'
                  ? 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400'
                  : contract.status === 'sent'
                  ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400'
              }`}>
                {contract.status === 'draft' ? 'Borrador' : contract.status === 'sent' ? 'Pendiente' : contract.status === 'client_signed' ? 'Firmado (Cliente)' : contract.status === 'accepted' ? 'Sellado' : contract.status === 'completed' ? 'Completado' : 'Cancelado'}
              </span>
            </div>

            {/* Parties with RFC / Regimen details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="rounded-xl border border-slate-100 dark:border-slate-900 p-4">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-3xs">Prestador de Servicios (Freelancer)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                  {contract.beneficiaryName || "Freelancer Registrado"}
                </span>
                {contract.freelancerRfc && (
                  <div className="text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-light">
                    <p>RFC: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.freelancerRfc}</span></p>
                    <p className="line-clamp-1">Regimen: {contract.freelancerRegimen}</p>
                    <p>Código Postal Fiscal: {contract.freelancerPostal}</p>
                  </div>
                )}
              </div>
              
              <div className="rounded-xl border border-slate-100 dark:border-slate-900 p-4">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-3xs">Cliente</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">{contract.clientName}</span>
                <span className="text-slate-500 dark:text-slate-400 mt-0.5 block">{contract.clientEmail}</span>
                {contract.clientRfc ? (
                  <div className="text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-light">
                    <p>RFC: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.clientRfc}</span></p>
                    {contract.clientRegimen && <p className="line-clamp-1">Regimen: {contract.clientRegimen}</p>}
                    {contract.clientPostal && <p>Código Postal Fiscal: {contract.clientPostal}</p>}
                  </div>
                ) : (
                  <p className="text-2xs text-slate-400 italic mt-2">Sin datos fiscales adicionales</p>
                )}
              </div>
            </div>
          </div>

          {/* Scope details */}
          <div className="py-6 border-b border-slate-100 dark:border-slate-900 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Declaraciones & Alcance del Proyecto</h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-350 font-light">{contract.scopeDescription}</p>
          </div>

          {/* Clause list */}
          <div className="py-6 border-b border-slate-100 dark:border-slate-900 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cláusulas Legales Generales</h3>
            <div className="flex flex-col gap-4 text-xs">
              {(() => {
                const renderedClauses = contract.selectedClauses && contract.selectedClauses.length > 0
                  ? MOCK_CLAUSES.filter(c => contract.selectedClauses?.includes(c.id))
                  : MOCK_CLAUSES;
                return renderedClauses.map((clause, idx) => (
                  <div key={clause.id} className="flex gap-3">
                    <span className="font-mono font-bold text-indigo-500 bg-indigo-500/5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">{clause.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-light">{clause.content}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Signature log block */}
          <div className="py-6 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aceptación y Firmas Electrónicas</h3>
            
            {/* 1. Client signature details if present */}
            {contract.acceptedAt ? (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Firmado Electrónicamente por el Cliente</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-500 dark:text-slate-400 mt-1 font-light">
                  <p>Firmante: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.acceptedByName}</span></p>
                  <p>Dirección IP: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.acceptedIp}</span></p>
                  <p>Fecha/Hora: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.acceptedAt ? new Date(contract.acceptedAt).toLocaleString('es-MX') : ''}</span></p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-dashed p-6 text-center text-slate-400 text-xs font-light">
                Pendiente de firma de aceptación del Cliente. Presiona el botón en la parte superior para firmar electrónicamente.
              </div>
            )}

            {/* 2. Freelancer counter-signature details if present */}
            {(contract.status === 'accepted' || contract.status === 'completed') && contract.freelancerAcceptedAt ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs flex flex-col gap-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verificado y Contra-firmado por el Freelancer</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-500 dark:text-slate-400 mt-1 font-light">
                      <p>Validador: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.freelancerAcceptedByName}</span></p>
                      <p>Dirección IP: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.freelancerAcceptedIp}</span></p>
                      <p>Fecha/Hora: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.freelancerAcceptedAt ? new Date(contract.freelancerAcceptedAt).toLocaleString('es-MX') : ''}</span></p>
                    </div>
                  </div>
                  {profile?.signatureUrl && (
                    <img src={profile.signatureUrl} alt="Firma Freelancer" className="max-h-12 object-contain bg-white rounded-lg p-1 border border-slate-100 dark:border-slate-800 dark:bg-slate-900/50" />
                  )}
                </div>
              </div>
            ) : contract.status === 'client_signed' ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                  <Clock className="h-4 w-4" />
                  <span>Pendiente de Validación Final por el Freelancer</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-light mt-1">
                  Tu firma ha sido registrada. El contrato se sellará y los cobros de hitos se habilitarán en cuanto el freelancer revise el documento y contra-firme.
                </p>
              </div>
            ) : null}

            {/* 3. Cryptographic seal explainer */}
            {contract.contractHash && (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 text-xs flex flex-col gap-3 mt-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Sello de Integridad Criptográfica Activo</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                  ¿Para qué sirve este sello? Este código hash es una huella digital única generada usando el algoritmo **SHA-256**. Captura el contenido exacto de este contrato (montos, hitos, términos y firmas de ambas partes). Cualquier modificación posterior rompería esta huella digital, garantizando la inmutabilidad absoluta y la validez legal del acuerdo.
                </p>
                <div className="bg-slate-100 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-3xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Código de Seguridad Hash SHA-256</span>
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300 break-all select-all font-light">{contract.contractHash}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Timeline Audit Trail */}
          {auditLogs.length > 0 && (
            <div className="py-6 border-t border-slate-100 dark:border-slate-900 mt-6 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial del Contrato (Audit Log)</h3>
              
              <div className="flow-root mt-2">
                <ul role="list" className="-mb-8">
                  {auditLogs.map((log, logIdx) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {logIdx !== auditLogs.length - 1 ? (
                          <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3 items-start">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-slate-950 ${
                              log.action === 'created' ? 'bg-slate-100 dark:bg-slate-900 text-slate-500' :
                              log.action === 'client_signed' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-600' :
                              log.action === 'freelancer_accepted' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' :
                              log.action === 'milestone_requested' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600' :
                              log.action === 'milestone_transferred' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600' :
                              'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600'
                            }`}>
                              {log.action === 'created' && <Briefcase className="h-4 w-4" />}
                              {log.action === 'client_signed' && <ShieldCheck className="h-4 w-4" />}
                              {log.action === 'freelancer_accepted' && <CheckCircle2 className="h-4 w-4" />}
                              {log.action === 'milestone_requested' && <Clock className="h-4 w-4" />}
                              {log.action === 'milestone_transferred' && <CreditCard className="h-4 w-4" />}
                              {log.action === 'milestone_confirmed' && <CheckCircle2 className="h-4 w-4" />}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs text-slate-700 dark:text-slate-300">
                                {log.details}
                                {log.ip && <span className="text-3xs text-slate-400 block mt-0.5">IP registrada: {log.ip}</span>}
                              </p>
                            </div>
                            <div className="text-right text-3xs whitespace-nowrap text-slate-400 self-start">
                              <time dateTime={log.timestamp}>{new Date(log.timestamp).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</time>
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

          {/* Printable signature lines */}
          <div className="hidden print:grid grid-cols-2 gap-16 mt-20 pt-8 border-t border-slate-200">
            <div className="text-center flex flex-col items-center justify-between min-h-[90px]">
              <div className="h-12 flex items-center justify-center">
                {contract.freelancerAcceptedAt ? (
                  profile?.signatureUrl ? (
                    <img src={profile.signatureUrl} alt="Firma Freelancer" className="max-h-12 object-contain" />
                  ) : (
                    <div className="text-[#10b981] text-3xs font-mono leading-tight">
                      [VALIDADO DIGITALMENTE]<br />
                      FECHA: {new Date(contract.freelancerAcceptedAt).toLocaleDateString('es-MX')}<br />
                      IP: {contract.freelancerAcceptedIp}
                    </div>
                  )
                ) : (
                  <span className="text-3xs text-slate-300 italic">Pendiente de firma del Prestador</span>
                )}
              </div>
              <div className="w-full border-t border-slate-300 pt-2 text-xs">
                <p className="font-bold text-slate-700">{contract.beneficiaryName}</p>
                {contract.freelancerRfc && <p className="text-slate-400 font-mono text-3xs">RFC: {contract.freelancerRfc}</p>}
                <p className="text-slate-400">Prestador de Servicios</p>
              </div>
            </div>

            <div className="text-center flex flex-col items-center justify-between min-h-[90px]">
              <div className="h-12 flex items-center justify-center">
                {contract.acceptedAt ? (
                  <div className="text-[#6366f1] text-3xs font-mono leading-tight">
                    [FIRMADO ELECTRÓNICAMENTE]<br />
                    FECHA: {new Date(contract.acceptedAt).toLocaleDateString('es-MX')}<br />
                    IP: {contract.acceptedIp}<br />
                    HASH: {contract.contractHash?.substring(0, 16)}...
                  </div>
                ) : (
                  <span className="text-3xs text-slate-300 italic">Pendiente de firma del Cliente</span>
                )}
              </div>
              <div className="w-full border-t border-slate-300 pt-2 text-xs">
                <p className="font-bold text-slate-700">{contract.acceptedByName || contract.clientName}</p>
                {contract.clientRfc && <p className="text-slate-400 font-mono text-3xs">RFC: {contract.clientRfc}</p>}
                <p className="text-slate-400">Cliente</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 print:hidden">
          {/* Freelancer Reputation / Standing Card */}
          <div className="glass rounded-3xl p-5 border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-4 text-left">
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
              Freelancer en Buena Posición
            </h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Reputación de Confianza de Anticipo MX
              </div>
              <ul className="text-3xs text-slate-500 dark:text-slate-450 flex flex-col gap-1.5 leading-normal pl-1">
                <li className="flex items-center gap-1.5">✓ Identidad fiscal emisor validada (RFC {contract.freelancerRfc ? "Registrado" : "N/A"})</li>
                <li className="flex items-center gap-1.5">✓ Sello de integridad criptográfica activo</li>
                <li className="flex items-center gap-1.5">✓ 0 penalizaciones ni disputas vigentes</li>
                <li className="flex items-center gap-1.5">✓ Hitos financieros protegidos por escrow</li>
              </ul>
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-1 flex justify-between items-center text-3xs text-slate-400">
                <span>Miembro desde</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">Julio 2026</span>
              </div>
            </div>
          </div>

          {/* SPEI bank details card */}
          <div className="glass rounded-3xl p-5 border-indigo-500/20 bg-white/70 dark:bg-slate-950/70 flex flex-col gap-4 text-left">
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-indigo-500">
              <Briefcase className="h-4 w-4" />
              Detalles Financieros del Proyecto
            </h3>
            
            <div className="flex flex-col gap-2">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Total Acordado</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {formatMoney(contract.totalAmount, contract.currency)}
              </span>
            </div>

            {contract.clabe && (
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col gap-3">
                <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Información para Transferir (SPEI)</span>
                
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 flex flex-col gap-2 border border-slate-100 dark:border-slate-800/30">
                  <div className="text-xs">
                    <span className="text-slate-400 font-light block">Titular:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.beneficiaryName}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400 font-light block">Banco:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.bankName}</span>
                  </div>
                  <div className="text-xs flex items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-400 font-light block">CLABE Interbancaria:</span>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tracking-wide">{contract.clabe}</span>
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
            <div className="glass rounded-3xl p-5 border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 flex flex-col gap-4 text-left">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Entrega y Finalización del Proyecto
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 leading-normal">
                Si el freelancer ha completado la entrega de los servicios/productos acordados, puedes marcar tu confirmación de conformidad a continuación.
              </p>
              
              <div className="flex flex-col gap-2">
                {contract.clientCompletedAt ? (
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
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
                  className="w-full rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 font-semibold py-2.5 text-xs transition-colors cursor-pointer"
                >
                  Cancelar Contrato (Detener Proyecto)
                </button>
              </div>
            </div>
          )}

          {/* Active invoice request */}
          {activePayment && contract.status === 'accepted' ? (
            <div className="glass rounded-3xl p-5 border-amber-500/20 bg-amber-500/5 flex flex-col gap-4 text-left animate-pulse-subtle">
              <h4 className="text-xs font-extrabold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Pago Solicitado / En Espera
              </h4>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{activePayment.label}</p>
                <p className="text-2xs text-slate-400 mt-0.5">Vence: {new Date(activePayment.dueDate).toLocaleDateString('es-MX')}</p>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-slate-400 text-xs">Monto a pagar:</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
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
            <div className="glass rounded-3xl p-5 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col gap-2 text-left">
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
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calendario de Hitos</h4>
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
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
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
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{formatMoney(m.amount, contract.currency)}</p>
                      <span className={`text-4xs font-bold uppercase ${
                        m.status === 'confirmed' ? 'text-indigo-500' : m.status === 'marked_paid' ? 'text-emerald-500' : m.status === 'requested' ? 'text-amber-500' : 'text-slate-400'
                      }`}>
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
                <label className="block text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Monto Transferido ({contract.currency})</label>
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
              {contract.currency === "USD" && (
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
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Notificar Pago
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Acceptance Modal Dialog */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="glass rounded-3xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 text-left bg-white dark:bg-slate-950 shadow-2xl border border-indigo-500/20">
            <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-500">
              <ShieldCheck className="h-6 w-6" />
              Aceptar Contrato de Servicios
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Al escribir tu nombre completo a continuación, confirmas tu consentimiento y aceptación de todos los términos detallados en esta propuesta, incluyendo el alcance, la tarifa de {formatMoney(contract.totalAmount, contract.currency)}, el esquema de anticipos y las cláusulas de ley adjuntas.
            </p>
            <p className="text-4xs text-slate-400 mt-2 leading-normal">
              Guardaremos tu nombre completo, marca de tiempo y tu dirección IP pública para el registro de auditoría digital de conformidad con el Art. 89 del Código de Comercio de México.
            </p>

            <form onSubmit={handleAcceptContract} className="mt-6 flex flex-col gap-4">
              {acceptStep === 'name' ? (
                <div>
                  <label className="block text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre completo del Firmante</label>
                  <input
                    type="text"
                    required
                    placeholder="Escribe tu nombre y apellido"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {debugOtp && (
                    <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-3 rounded-xl text-3xs text-indigo-700 dark:text-indigo-400 font-semibold leading-relaxed">
                      💡 <strong>Demo Debug Info:</strong> El código de firma enviado al cliente es: <span className="font-extrabold underline text-sm tracking-widest">{debugOtp}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Código de Firma Electrónica (OTP de 6 dígitos)</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      disabled={otpAttempts >= 3}
                      placeholder="Ej. 123456"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm font-bold text-center tracking-widest focus:border-indigo-500 focus:outline-none dark:text-white disabled:opacity-50"
                    />
                  </div>
                  {otpError && (
                    <span className="text-3xs text-red-500 font-semibold">{otpError}</span>
                  )}
                  {otpAttempts >= 3 && (
                    <button
                      type="button"
                      onClick={handleRegenerateOtp}
                      className="text-xs font-bold text-indigo-500 hover:text-indigo-400 text-left underline focus:outline-none"
                    >
                      Generar un nuevo código OTP
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (acceptStep === 'otp') {
                      setAcceptStep('name');
                    } else {
                      setShowAcceptModal(false);
                    }
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {acceptStep === 'otp' ? "Atrás" : "Cancelar"}
                </button>
                <button
                  type="submit"
                  disabled={loading || (acceptStep === 'name' ? !signerName : (otpInput.length < 6 || otpAttempts >= 3))}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : acceptStep === 'name' ? (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Enviar Código de Firma
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Verificar y Firmar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Modal Dialog */}
      {showRevisionModal && contract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-red-500/20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 sticky top-0 z-10 rounded-t-3xl">
              <h3 className="font-bold text-red-500 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Proponer Cambios y Solicitar Revisión
              </h3>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleProposeRevision} className="p-6 flex flex-col gap-6 text-left">
              
              {/* Section 1: Client Details */}
              <div className="flex flex-col gap-4">
                <h4 className="text-2xs font-extrabold text-red-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5">1. Tus Datos de Facturación (Cliente)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Nombre / Razón Social</label>
                    <input
                      type="text"
                      required
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={editClientEmail}
                      onChange={(e) => setEditClientEmail(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Teléfono de Contacto</label>
                    <input
                      type="text"
                      value={editClientPhone}
                      onChange={(e) => setEditClientPhone(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none dark:text-white"
                      placeholder="Ej. +525512345678"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Tu RFC</label>
                    <input
                      type="text"
                      value={editClientRfc}
                      onChange={(e) => setEditClientRfc(e.target.value.toUpperCase())}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none dark:text-white font-mono"
                      placeholder="Ej. GUEH860710MX3"
                      maxLength={13}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Régimen Fiscal</label>
                    <select
                      value={editClientRegimen}
                      onChange={(e) => setEditClientRegimen(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none dark:text-white bg-slate-900"
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
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none dark:text-white"
                      placeholder="Ej. 06000"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Scope, Budget, and Taxes */}
              <div className="flex flex-col gap-4">
                <h4 className="text-2xs font-extrabold text-red-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5">2. Configuración del Proyecto y Retenciones</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Scope Input */}
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Concepto y Alcance de Trabajo</label>
                    <textarea
                      rows={4}
                      required
                      value={editScopeDescription}
                      onChange={(e) => setEditScopeDescription(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs focus:border-red-500 focus:outline-none dark:text-white"
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
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent pl-6 pr-3 py-1.5 text-xs font-bold focus:border-red-500 focus:outline-none dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase">Moneda</label>
                      <select
                        value={editCurrency}
                        onChange={(e) => setEditCurrency(e.target.value as 'MXN' | 'USD')}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none dark:text-white bg-slate-900 font-bold"
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
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-650 focus:ring-indigo-500"
                        />
                        Retención ISR (10% Freelancer)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editRetencionIva}
                          onChange={(e) => setEditRetencionIva(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700 text-indigo-650 focus:ring-indigo-500"
                        />
                        Retención IVA (10.667% / 2/3 partes)
                      </label>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="md:col-span-2 bg-red-500/5 p-4 rounded-xl border border-red-500/10 flex flex-col gap-2 text-xs">
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
                      <span className="text-red-500">
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
                  <h4 className="text-2xs font-extrabold text-red-500 uppercase tracking-wider">3. Esquema de Cobro y Entregables</h4>
                  <button
                    type="button"
                    onClick={handleEditAddMilestone}
                    className="flex items-center gap-1 rounded bg-red-550/10 hover:bg-red-550/20 text-red-500 border border-red-500/20 px-2 py-1 text-4xs font-bold uppercase transition-colors cursor-pointer"
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
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none dark:text-white"
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
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-red-500 focus:outline-none dark:text-white"
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
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent pl-5 pr-2 py-1.5 text-xs font-bold focus:border-red-500 focus:outline-none dark:text-white"
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
                <h4 className="text-2xs font-extrabold text-red-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5">4. Cláusulas del Acuerdo</h4>
                <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-slate-100/20 dark:bg-slate-900/10">
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
                        className={`flex gap-3 items-start p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 cursor-pointer select-none transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 ${isChecked ? 'bg-red-500/5 border-red-500/30! ring-1 ring-red-500/20' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div onClick
                          className="rounded border-slate-350 dark:border-slate-700 text-red-500 focus:ring-red-500 mt-0.5 pointer-events-none"
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

              {/* Section 5: Revision Reason */}
              <div className="flex flex-col gap-1.5 border-t border-slate-200 dark:border-slate-800 pt-6">
                <h4 className="text-2xs font-extrabold text-red-500 uppercase tracking-wider pb-1.5">5. Comentarios de la Revisión (Requerido)</h4>
                <label className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Explica los motivos de estos cambios al freelancer</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej. Favor de corregir el monto de los hitos y modificar el alcance del proyecto de acuerdo a lo platicado..."
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2.5 text-xs focus:border-red-500 focus:outline-none dark:text-white"
                />
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
                        {formatMoney(contract.totalAmount, contract.currency)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-650 dark:text-slate-450 flex flex-col gap-2">
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
                    <div className="text-xs text-slate-850 dark:text-white flex flex-col gap-2">
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
                  onClick={() => setShowRevisionModal(false)}
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:hidden">
          <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-500/20 flex flex-col gap-4 text-left">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2">
                Cancelar Contrato
              </h3>
              <p className="text-2xs text-slate-400 mt-1">
                Ingresa el motivo de cancelación del contrato. Se notificará al freelancer y quedará registrado en la bitácora de auditoría.
              </p>
            </div>
            <textarea
              rows={4}
              required
              placeholder="Ej. Mutuo acuerdo, cambio de proveedor, etc..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-3 py-2 text-xs focus:border-red-500 focus:outline-none dark:text-white transition-all resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsCancellingContract(false);
                  setCancelReason("");
                }}
                className="rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-2xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handleCancelContract}
                disabled={!cancelReason.trim()}
                className="rounded-lg bg-red-650 hover:bg-red-550 text-white font-bold px-4 py-2 text-2xs transition-colors disabled:opacity-50"
              >
                Confirmar Cancelación
              </button>
            </div>
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
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-755 dark:text-slate-400 dark:hover:text-slate-200"
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
                    className="rounded-xl bg-amber-600 hover:bg-amber-555 text-white px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
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

