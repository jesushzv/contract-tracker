"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  Settings,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  X
} from "lucide-react";
import { 
  getProfile, 
  updateProfile,
  getContracts,
  uploadBrandAsset,
  getPaymentProfiles,
  savePaymentProfile,
  deletePaymentProfile,
  shouldUseSupabase,
  getCachedProfile
} from "@/lib/storageClient";
import { supabase } from "@/lib/supabaseClient";
import { Profile, Contract, PaymentProfile } from "@/lib/types";
import { UpgradeAlert } from "@/app/components/UpgradeAlert";
import { AppShell } from "../../components/AppShell";
import { CancelPlanModal } from "@/app/components/modals/CancelPlanModal";

export default function SettingsPage() {
  const router = useRouter();
  const cachedProf = getCachedProfile();
  const [profile, setProfile] = useState<Profile | null>(cachedProf);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [paymentProfiles, setPaymentProfiles] = useState<PaymentProfile[]>([]);
  
  // Profile Form States
  const [fullName, setFullName] = useState(cachedProf?.fullName || "");
  const [rfc, setRfc] = useState(cachedProf?.rfc || "");
  const [regimenFiscal, setRegimenFiscal] = useState(cachedProf?.regimenFiscal || "");
  const [codigoPostal, setCodigoPostal] = useState(cachedProf?.codigoPostal || "");
  const [phone, setPhone] = useState(cachedProf?.phone || "");
  const [bankName, setBankName] = useState(cachedProf?.bankDetails?.bankName || "");
  const [clabe, setClabe] = useState(cachedProf?.bankDetails?.clabe || "");
  const [beneficiaryName, setBeneficiaryName] = useState(cachedProf?.bankDetails?.beneficiaryName || "");
  
  // Branding States
  const [logoUrl, setLogoUrl] = useState(cachedProf?.logoUrl || "");
  const [signatureUrl, setSignatureUrl] = useState(cachedProf?.signatureUrl || "");
  const [uploadError, setUploadError] = useState("");
  
  // Payment Profiles States
  const [editingProfile, setEditingProfile] = useState<PaymentProfile | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileNickname, setProfileNickname] = useState("");
  const [profileBankName, setProfileBankName] = useState("");
  const [profileClabe, setProfileClabe] = useState("");
  const [profileInstructions, setProfileInstructions] = useState("");
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  // Feedback States
  const [feedbackCategory, setFeedbackCategory] = useState("bug");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // CSD States
  const [csdPassword, setCsdPassword] = useState("");
  const [isUploadingCsd, setIsUploadingCsd] = useState(false);
  const [hasActiveCsd, setHasActiveCsd] = useState(false);
  const [csdUploadSuccess, setCsdUploadSuccess] = useState(false);
  const [csdError, setCsdError] = useState("");

  // Password Change States
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);
  const [passwordUpdateError, setPasswordUpdateError] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        if (typeof window !== "undefined") {
          setIsDemo(localStorage.getItem("demo_mode") === "true");
        }
        
        const prof = await getProfile();
        setProfile(prof);
        if (prof) {
          setFullName(prof.fullName || "");
          setClabe(prof.bankDetails?.clabe || "");
          setBankName(prof.bankDetails?.bankName || "");
          setBeneficiaryName(prof.bankDetails?.beneficiaryName || "");
          setRfc(prof.rfc || "");
          setRegimenFiscal(prof.regimenFiscal || "");
          setCodigoPostal(prof.codigoPostal || "");
          setLogoUrl(prof.logoUrl || "");
          setSignatureUrl(prof.signatureUrl || "");
          setPhone(prof.phone || "");
        }

        try {
          const profilesList = await getPaymentProfiles(prof?.id);
          setPaymentProfiles(profilesList || []);
        } catch (err) {
          console.error("Error loading payment profiles:", err);
        }

        const allContracts = await getContracts();
        setContracts(allContracts || []);
        
        if (prof?.id) {
          try {
            const csdRes = await fetch(`/api/csd?freelancerId=${prof.id}`);
            if (csdRes.ok) {
              const csdData = await csdRes.json();
              if (csdData.hasCsd) {
                setHasActiveCsd(true);
              }
            }
          } catch (err) {
            console.error("Error loading CSD:", err);
          }
        }
      } catch (err) {
        console.error("Error in loadInitialData:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdateError("");
    setPasswordUpdateSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setPasswordUpdateError("Las contraseñas no coinciden.");
      return;
    }

    const hasLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setPasswordUpdateError("La contraseña debe cumplir con todos los requisitos de seguridad.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      if (!shouldUseSupabase()) {
        // Simulate password update in demo mode
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setPasswordUpdateSuccess(true);
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPasswordUpdateSuccess(false), 5000);
      } else {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          throw new Error(error.message);
        }

        setPasswordUpdateSuccess(true);
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPasswordUpdateSuccess(false), 5000);
      }
    } catch (err) {
      const error = err as Error;
      setPasswordUpdateError(error.message || "Error al actualizar la contraseña.");
    } finally {
      setIsUpdatingPassword(false);
    }
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

  const handleCsdUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!csdPassword) {
      setCsdError("Por favor, proporciona tu Facturapi Live Secret Key.");
      return;
    }
    if (!profile.rfc || profile.rfc.length < 12) {
      setCsdError("Tu RFC de Perfil Fiscal no parece válido. Por favor guárdalo primero.");
      return;
    }
    setIsUploadingCsd(true);
    setCsdError("");
    setCsdUploadSuccess(false);

    try {
      const res = await fetch("/api/csd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freelancerId: profile.id,
          password: csdPassword,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir CSD");
      
      setHasActiveCsd(true);
      setCsdUploadSuccess(true);
      setCsdPassword("");
      setTimeout(() => setCsdUploadSuccess(false), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setCsdError(message);
    } finally {
      setIsUploadingCsd(false);
    }
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
      
      const profilesList = await getPaymentProfiles(profile.id);
      setPaymentProfiles(profilesList);
      
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

  const handleManageBilling = async () => {
    if (isDemo) {
      router.push("/plans");
      return;
    }
    setIsBillingLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        throw new Error(data.error || "Fallo al iniciar sesión de portal");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Error al abrir portal de facturación: " + msg);
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const res = await fetch("/api/stripe/reactivate-subscription", { method: "POST" });
      if (!res.ok) throw new Error("Fallo al reactivar");
      
      const prof = await getProfile();
      setProfile(prof);
    } catch (err: unknown) {
      alert("Error al reactivar suscripción: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsReactivating(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: feedbackCategory,
          subject: feedbackSubject,
          message: feedbackMessage
        })
      });
      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedbackSubject("");
        setFeedbackMessage("");
        setTimeout(() => setFeedbackSuccess(false), 3000);
      } else {
        alert("Error al enviar comentarios.");
      }
    } catch {
      alert("Error de conexión al enviar comentarios.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const contractUsage = contracts.filter(c => c.freelancerId === profile?.id).length;
  const planLimit = profile?.tier === "pro" ? Infinity : (profile?.tier === "starter" ? 10 : 3);
  const usagePercentage = profile?.tier === "pro" ? 100 : Math.min(100, (contractUsage / planLimit) * 100);

  return (
    <AppShell activePath="/dashboard/settings">
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-6 text-slate-800">
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/dashboard"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Configuración de Cuenta
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra tus datos fiscales, identidad de marca y suscripción.
          </p>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 md:p-8 border-indigo-500/20 bg-white/50 flex flex-col gap-8 shadow-sm">
        
        {/* Section 1: Perfil Fiscal y Personal */}
        <section>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <Settings className="h-5 w-5 text-indigo-500" />
              Perfil Fiscal y Personal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Esta información se plasmará automáticamente en la carátula de tus contratos.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Correo Electrónico de la Cuenta (Registrado)</label>
              <input
                type="email"
                disabled
                value={profile?.email || ""}
                className="rounded-xl border border-slate-200 bg-slate-100/60 dark:bg-slate-900/40 px-4 py-2 text-sm text-slate-500 cursor-not-allowed font-mono focus:outline-none"
              />
              <p className="text-[10px] text-slate-400">Esta es la dirección de correo con la que inicias sesión y no se puede cambiar.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Nombre Completo Titular</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
                className="rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none uppercase font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Régimen Fiscal (Sat)</label>
              <select
                value={regimenFiscal}
                onChange={(e) => setRegimenFiscal(e.target.value)}
                className="rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
                className="rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Teléfono (WhatsApp)</label>
              <input
                type="tel"
                placeholder="Ej. +525512345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
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
          </form>
        </section>

        <hr className="border-slate-200" />

        {/* Section: Seguridad y Contraseña */}
        <section>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Seguridad y Contraseña
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Actualiza tu contraseña para mantener tu cuenta segura.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            {passwordUpdateError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-600 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed font-semibold">{passwordUpdateError}</p>
              </div>
            )}

            {passwordUpdateSuccess && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-250 p-3.5 text-xs text-emerald-600 flex items-start gap-2.5">
                <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed font-semibold">Contraseña actualizada con éxito.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Nueva Contraseña (Mínimo 8 caracteres)</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-transparent pl-4 pr-10 py-2 text-sm focus:border-indigo-500 focus:outline-none transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength checklist */}
                {newPassword.length > 0 && (
                  <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-3xs flex flex-col gap-1.5 text-left">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Requisitos de Seguridad:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <span className={`flex items-center gap-1 font-medium ${newPassword.length >= 8 ? "text-emerald-600" : "text-slate-500"}`}>
                        {newPassword.length >= 8 ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                        Mínimo 8 caracteres
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${/[A-Z]/.test(newPassword) ? "text-emerald-600" : "text-slate-500"}`}>
                        {/[A-Z]/.test(newPassword) ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                        1 Mayúscula
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${/[a-z]/.test(newPassword) ? "text-emerald-600" : "text-slate-500"}`}>
                        {/[a-z]/.test(newPassword) ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                        1 Minúscula
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${/[0-9]/.test(newPassword) ? "text-emerald-650" : "text-slate-500"}`}>
                        {/[0-9]/.test(newPassword) ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                        1 Número
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${/[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-600" : "text-slate-500"}`}>
                        {/[^A-Za-z0-9]/.test(newPassword) ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                        1 Carácter Especial
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-transparent pl-4 pr-10 py-2.5 text-sm focus:border-indigo-500 focus:outline-none transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isUpdatingPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </button>
            </div>
          </form>
        </section>

        <hr className="border-slate-200" />

        {/* Section 2: Identidad de Marca (Branding) */}
        <section>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Identidad de Marca (Branding)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personaliza el logotipo y la firma digital que aparecerán en tus contratos.
            </p>
          </div>

          {profile?.tier === "free" ? (
            <UpgradeAlert
              title="Branding Personalizado"
              description="Personaliza tus contratos con tu propio logotipo y firma digital."
              planNeeded="Starter o Pro"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Logo de tu Empresa</label>
                  <input type="file" disabled className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs opacity-50" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Firma Digital</label>
                  <input type="file" disabled className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs opacity-50" />
                </div>
              </div>
            </UpgradeAlert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Logo de tu Empresa (PNG, JPG, SVG - Máx 2MB)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={(e) => handleBrandFileUpload(e.target.files?.[0], "logo")}
                    className="flex-grow rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  {logoUrl && (
                    <img src={logoUrl} alt="Preview Logo" className="h-10 w-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5" />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Firma Digital (PNG, JPG - Máx 2MB)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => handleBrandFileUpload(e.target.files?.[0], "signature")}
                    className="flex-grow rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  {signatureUrl && (
                    <img src={signatureUrl} alt="Preview Signature" className="h-10 w-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5" />
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="md:col-span-2 text-xs text-red-500 font-semibold bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                  ⚠️ {uploadError}
                </div>
              )}
            </div>
          )}
        </section>

        <hr className="border-slate-200" />

        {/* Section 3: Facturación Automática (BYOK) */}
        <section>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Facturación 4.0 Automática
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Conecta tu cuenta de Facturapi para emitir comprobantes CFDI 4.0 automáticamente al completar un hito.
            </p>
          </div>
          
          {profile?.tier === "free" || profile?.tier === "starter" ? (
            <UpgradeAlert
              title="Facturación Automática"
              description="Habilita la emisión automática de CFDI 4.0 al completar tus hitos."
              planNeeded="Pro"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Facturapi Live Secret Key</label>
                <input type="password" disabled className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs opacity-50 w-full" value="sk_live_*****************" />
              </div>
            </UpgradeAlert>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              {hasActiveCsd ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl border border-green-200">
                    <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-sm">Conectado a Facturapi</h4>
                      <p className="text-xs opacity-80 mt-0.5">Tus credenciales están encriptadas y listas para facturar.</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">¿Necesitas actualizar tu llave? Ingrésala nuevamente abajo.</p>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-xs text-slate-600 leading-relaxed bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <strong>Instrucciones:</strong><br />
                    1. Ve a <a href="https://www.facturapi.io" target="_blank" rel="noreferrer" className="text-blue-600 underline">Facturapi.com</a> y crea una cuenta gratuita.<br />
                    2. Sube tus archivos CSD (.cer y .key) en su plataforma y activa el modo <b>Live</b>.<br />
                    3. Ve a <i>Configuración {'>'} API Keys</i>, copia tu <b>Secret Key</b> (inicia con <code className="bg-blue-100 px-1 rounded">sk_live_</code>) y pégala aquí.
                  </p>
                </div>
              )}

              <form onSubmit={handleCsdUpload} className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">Facturapi Live Secret Key</label>
                  <input
                    type="password"
                    value={csdPassword}
                    onChange={(e) => setCsdPassword(e.target.value)}
                    placeholder="sk_live_..."
                    className="rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none w-full"
                    required={!hasActiveCsd}
                  />
                </div>

                {csdError && (
                  <div className="text-xs text-red-500 font-semibold bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                    ⚠️ {csdError}
                  </div>
                )}

                {csdUploadSuccess && (
                  <div className="text-xs text-green-600 font-semibold bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                    ✓ Llave guardada y encriptada con éxito.
                  </div>
                )}

                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={isUploadingCsd || !csdPassword}
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingCsd ? "Guardando..." : (hasActiveCsd ? "Actualizar Llave" : "Guardar Llave")}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        <hr className="border-slate-200" />

        {/* Section 4: Cuentas Bancarias */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-lg font-bold text-slate-900">Cuentas Bancarias</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Registra múltiples cuentas para prellenar datos rápidamente.
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
              className="rounded-xl bg-indigo-50 text-indigo-650 border border-indigo-200/50 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              {showProfileForm ? "Cancelar" : "+ Agregar Cuenta"}
            </button>
          </div>

          {/* Legacy default account form hidden for simplicity, or we map `clabe`, `bankName` to the first default profile above? 
              Wait, the old page had "Banco Receptor" directly on the profile. We can keep it or rely completely on paymentProfiles.
              Since we moved it out of the main form above, let's just use the paymentProfiles array here and let user add the first one.
          */}
          
          <div className="mb-4">
            {showProfileForm && (
              <form onSubmit={handleSaveProfile} className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-3xs font-semibold text-slate-455 uppercase tracking-wider">Apodo de la Cuenta</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mi Cuenta Principal"
                    value={profileNickname}
                    onChange={(e) => setProfileNickname(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
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
                    className="rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
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
                    className="rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-3xs font-semibold text-slate-455 uppercase tracking-wider">Instrucciones de Pago Adicionales</label>
                  <input
                    type="text"
                    placeholder="Ej. Transferir neto antes de las 5pm"
                    value={profileInstructions}
                    onChange={(e) => setProfileInstructions(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-transparent px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={!profileNickname || !profileBankName || profileClabe.length !== 18}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-semibold px-4 py-2 text-xs transition-colors shadow-md shadow-indigo-500/10 disabled:opacity-50 cursor-pointer"
                  >
                    Guardar Cuenta
                  </button>
                </div>
              </form>
            )}
          </div>

          {paymentProfiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentProfiles.map((p) => (
                <div key={p.id} className={`rounded-2xl border p-5 flex flex-col justify-between gap-3 ${p.isDefault ? "border-indigo-500 bg-indigo-500/5 shadow-sm shadow-indigo-500/10" : "border-slate-200 "}`}>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-850 flex items-center gap-1.5">
                        {p.nickname}
                        {p.isDefault && <span className="rounded-full bg-indigo-500 text-white text-3xs px-2 py-0.5 font-semibold">Predeterminado</span>}
                      </span>
                      <span className="font-mono text-xs text-slate-400">{p.bankName}</span>
                    </div>
                    <p className="font-mono text-sm text-slate-600 break-all select-all mt-1">CLABE: {p.clabe}</p>
                    {p.paymentInstructions && (
                      <p className="text-xs text-slate-450 italic mt-2">Nota: {p.paymentInstructions}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-3 mt-1">
                    {!p.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultProfile(p.id)}
                        className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
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
                      className="text-xs font-semibold text-slate-600 hover:underline cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(p.id)}
                      className="text-xs font-semibold text-red-650 hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 font-light leading-normal">
              No tienes cuentas bancarias registradas. Añade una para facilitar el llenado de tus contratos.
            </div>
          )}
        </section>

        <hr className="border-slate-200" />

        {/* Section 4: Plan & Facturación */}
        <section>
          <div className="mb-6">
            <h4 className="text-lg font-bold text-slate-900">
              Plan de Suscripción y Facturación
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Revisa tu consumo actual de contratos y mejora tu plan para desbloquear más funciones.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-extrabold text-lg text-slate-800 uppercase tracking-wide">
                  Plan {profile?.tier || "Gratuito"}
                </span>
                {profile?.subscriptionCancelAt ? (
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 border border-amber-500/20">
                    Cancelación Programada
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 border border-emerald-500/20">
                    Activo
                  </span>
                )}
              </div>
              
              {/* Progress Indicator */}
              <div className="max-w-md mt-4">
                <div className="flex justify-between text-xs text-slate-500 font-semibold mb-1.5">
                  <span>Uso de Contratos</span>
                  <span>
                    {profile?.tier === "pro" 
                      ? `${contractUsage} creados / ilimitados` 
                      : `${contractUsage} / ${planLimit} contratos`
                    }
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${ profile?.tier === "pro" ? "bg-purple-500 w-full" : (contractUsage / planLimit) >= 1 ? "bg-red-500 w-full" : "bg-indigo-650" }`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-3">
              {profile?.stripeCustomerId ? (
                <>
                  <button
                    type="button"
                    onClick={handleManageBilling}
                    disabled={isBillingLoading}
                    className="rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-3 text-sm transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isBillingLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      "Administrar Facturación"
                    )}
                  </button>
                  {profile.tier !== 'free' && profile.stripeSubscriptionId && !profile.subscriptionCancelAt && (
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      className="rounded-xl bg-transparent hover:bg-red-50 text-red-600 font-bold px-5 py-3 text-sm transition-colors flex items-center gap-2 cursor-pointer border border-transparent hover:border-red-200"
                    >
                      Cancelar Suscripción
                    </button>
                  )}
                </>
              ) : (
                <Link
                  href="/plans"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 text-sm transition-colors shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  Mejorar Plan
                </Link>
              )}
            </div>
          </div>
          
          {profile?.subscriptionCancelAt && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-amber-900">Suscripción Cancelada</h5>
                  <p className="text-xs text-amber-700 mt-1">
                    Tu suscripción actual finalizará el <strong>{new Date(profile.subscriptionCancelAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>. Seguirás teniendo acceso a tu plan hasta entonces.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReactivate}
                disabled={isReactivating}
                className="whitespace-nowrap rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold px-4 py-2 text-xs transition-colors disabled:opacity-50 border border-amber-300/50 cursor-pointer"
              >
                {isReactivating ? 'Reactivando...' : 'Reactivar suscripción'}
              </button>
            </div>
          )}
        </section>

        <hr className="border-slate-200" />

        {/* Section 5: Ayuda y Comentarios */}
        <section>
          <div className="mb-6">
            <h4 className="text-lg font-bold text-slate-900">
              Ayuda y Comentarios
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              ¿Tienes algún problema o sugerencia? Envíanos un mensaje directo.
            </p>
          </div>
          
          <form onSubmit={handleFeedbackSubmit} className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-semibold text-slate-455 uppercase tracking-wider">Categoría</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="bug">Reportar un error</option>
                  <option value="feature-request">Sugerir una función</option>
                  <option value="billing">Duda de facturación</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-semibold text-slate-455 uppercase tracking-wider">Asunto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Error al descargar PDF"
                  value={feedbackSubject}
                  onChange={(e) => setFeedbackSubject(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-455 uppercase tracking-wider">Mensaje</label>
              <textarea
                required
                rows={4}
                placeholder="Describe tu problema o sugerencia con el mayor detalle posible..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                className="rounded-xl border border-slate-300 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              {feedbackSuccess && (
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Mensaje enviado
                </span>
              )}
              <button
                type="submit"
                disabled={isSubmittingFeedback || !feedbackSubject || !feedbackMessage}
                className="rounded-xl bg-indigo-600 px-6 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingFeedback ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </span>
                ) : 'Enviar Mensaje'}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
    <CancelPlanModal 
      isOpen={showCancelModal}
      onClose={() => setShowCancelModal(false)}
      onSuccess={async () => {
        const prof = await getProfile();
        setProfile(prof);
      }}
      currentTier={(profile?.tier as 'free' | 'starter' | 'pro') || 'free'}
      activeContractsCount={contractUsage}
    />
    </AppShell>
  );
}
