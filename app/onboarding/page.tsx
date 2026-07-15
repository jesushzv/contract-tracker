"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { updateProfile, uploadBrandAsset, getProfile, isDemoMode } from "@/lib/storageClient";
import { Profile } from "@/lib/types";
import { ShieldCheck, ArrowRight, ArrowLeft, AlertCircle, Loader2, Landmark, Check } from "lucide-react";
import { validateRFC } from "@/lib/rfcValidator";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [rfc, setRfc] = useState("");
  const [regimenFiscal, setRegimenFiscal] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [bankName, setBankName] = useState("");
  const [clabe, setClabe] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [tier, setTier] = useState<'free' | 'starter' | 'pro'>("free");
  const [phone, setPhone] = useState("");
  
  const [error, setError] = useState("");

  const handleFileUpload = async (file: File, type: "logo" | "signature") => {
    setError("");
    if (file.size > 2 * 1024 * 1024) {
      setError("El archivo excede el límite de tamaño de 2MB.");
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
      } catch (err: unknown) {
        setError("Error al subir archivo: " + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsDataURL(file);
  };
  const [loading, setLoading] = useState(false);
  const [sessionCheckLoading, setSessionCheckLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const demoModeActive = isDemoMode();
        setIsDemo(demoModeActive);

        let userEmail = "";
        if (demoModeActive) {
          userEmail = "hector@freelancemx.dev";
          setEmail(userEmail);
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.push("/login");
            return;
          }
          userEmail = session.user.email || "";
          setEmail(userEmail);
        }

        const getCookie = (name: string): string | null => {
          if (typeof document === "undefined") return null;
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
          return null;
        };

        const signupTier = localStorage.getItem("selected_signup_tier") || getCookie("selected_signup_tier");

        const searchParams = new URLSearchParams(window.location.search);
        const sessionId = searchParams.get("session_id");

        let activeTier: 'free' | 'starter' | 'pro' | undefined = undefined;

        if (sessionId && !demoModeActive) {
          try {
            const res = await fetch(`/api/stripe/checkout-session?session_id=${sessionId}`);
            const data = await res.json();
            if (data.success && data.tier) {
              activeTier = data.tier;
              setTier(data.tier);
            }
          } catch (err) {
            console.error("Error syncing checkout session on client:", err);
          }
        }

        const prof = await getProfile();
        if (prof) {
          if (prof.fullName) setFullName(prof.fullName);
          if (prof.rfc) setRfc(prof.rfc);
          if (prof.regimenFiscal) setRegimenFiscal(prof.regimenFiscal);
          if (prof.codigoPostal) setCodigoPostal(prof.codigoPostal);
          if (prof.phone) setPhone(prof.phone);
          if (prof.bankDetails?.bankName) setBankName(prof.bankDetails.bankName);
          if (prof.bankDetails?.clabe) setClabe(prof.bankDetails.clabe);
          if (prof.logoUrl) setLogoUrl(prof.logoUrl);
          if (prof.signatureUrl) setSignatureUrl(prof.signatureUrl);
          
          if (!activeTier) {
            activeTier = prof.tier;
          }
        }

        // If they chose a paid tier during signup, but their profile tier is still free (hasn't paid yet),
        // redirect them to the plans checkout page for that tier
        if (signupTier && (signupTier === "starter" || signupTier === "pro") && activeTier === "free" && !sessionId) {
          localStorage.removeItem("selected_signup_tier");
          document.cookie = "selected_signup_tier=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
          router.push(`/plans?tier=${signupTier}`);
          return;
        }

        if (!activeTier && !sessionId) {
          router.push("/plans");
          return;
        }

        if (activeTier) {
          setTier(activeTier);
        }
      } catch (err) {
        console.error("Error checking session/profile in onboarding:", err);
      } finally {
        setSessionCheckLoading(false);
      }
    }
    checkSession();
  }, [router]);

  const [rfcError, setRfcError] = useState("");

  const handleRfcBlur = () => {
    if (!rfc) {
      setRfcError("");
      return;
    }
    const result = validateRFC(rfc);
    if (!result.isValid) {
      setRfcError(result.error || "RFC inválido");
    } else {
      setRfcError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Strict RFC check (only if provided)
    if (rfc) {
      const rfcCheck = validateRFC(rfc);
      if (!rfcCheck.isValid) {
        setError(rfcCheck.error || "RFC inválido");
        return;
      }
    }

    setLoading(true);

    try {
      const isDemo = new URLSearchParams(window.location.search).get("demo") === "true" || localStorage.getItem("demo_mode") === "true";
      let userId = "demo-freelancer-uuid";
      if (!isDemo) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("La sesión ha expirado. Inicia sesión de nuevo.");
          setLoading(false);
          return;
        }
        userId = session.user.id;
      }

      const newProfile: Profile = {
        id: userId,
        email,
        fullName,
        rfc: rfc || undefined,
        regimenFiscal: regimenFiscal || undefined,
        codigoPostal: codigoPostal || undefined,
        logoUrl: tier !== "free" ? (logoUrl || undefined) : undefined,
        signatureUrl: tier !== "free" ? (signatureUrl || undefined) : undefined,
        tier,
        phone: phone || undefined,
        bankDetails: {
          clabe,
          bankName,
          beneficiaryName: fullName
        }
      };

      await updateProfile(newProfile);
      router.push("/dashboard");
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Error al completar tu registro.");
      setLoading(false);
    }
  };

  if (sessionCheckLoading) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-24 text-center flex-grow flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center flex-grow flex items-center justify-center min-h-[90vh]">
      <div className="glass rounded-3xl p-8 flex flex-col gap-6 w-full text-left border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        {/* Back light glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-5">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Bienvenido a la Beta</h1>
            <p className="text-xs text-slate-400 mt-0.5">Configura tu perfil fiscal y datos bancarios para emitir contratos legales.</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-semibold">{error}</p>
          </div>
        )}

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between mb-8 max-w-md mx-auto relative px-4 pb-5 border-b border-slate-100 dark:border-slate-855">
          <div className="absolute left-10 right-10 top-5 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />
          <div 
            className="absolute left-10 top-5 h-0.5 bg-indigo-500 transition-all duration-300 -z-10" 
            style={{ width: currentStep === 1 ? "0%" : currentStep === 2 ? "44%" : "88%" }}
          />

          {/* Step 1 */}
          <button 
            type="button"
            onClick={() => currentStep > 1 && setCurrentStep(1)}
            className="flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
              currentStep === 1 
                ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-500/10" 
                : currentStep > 1
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
            }`}>
              {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <span className={`text-4xs font-bold uppercase tracking-wider ${
              currentStep === 1 ? "text-indigo-500" : currentStep > 1 ? "text-emerald-500" : "text-slate-400"
            }`}>
              Generales
            </span>
          </button>

          {/* Step 2 */}
          <button 
            type="button"
            onClick={() => {
              if (currentStep > 2) {
                setCurrentStep(2);
              } else if (currentStep === 1 && fullName) {
                setCurrentStep(2);
              }
            }}
            className="flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
              currentStep === 2 
                ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-500/10" 
                : currentStep > 2
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
            }`}>
              {currentStep > 2 ? <Check className="h-4 w-4" /> : "2"}
            </div>
            <span className={`text-4xs font-bold uppercase tracking-wider ${
              currentStep === 2 ? "text-indigo-500" : currentStep > 2 ? "text-emerald-500" : "text-slate-400"
            }`}>
              Fiscales
            </span>
          </button>

          {/* Step 3 */}
          <button 
            type="button"
            onClick={() => {
              if (currentStep === 2 && !rfcError) {
                setCurrentStep(3);
              }
            }}
            className="flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
              currentStep === 3 
                ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-500/10" 
                : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
            }`}>
              3
            </div>
            <span className={`text-4xs font-bold uppercase tracking-wider ${
              currentStep === 3 ? "text-indigo-500" : "text-slate-400"
            }`}>
              Cobro & Marca
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {currentStep === 1 && (
            <>
              {/* Section: Plan Selection */}
              <div className="md:col-span-2">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">
                  {!isDemo ? "Plan de Suscripción" : "Selecciona tu Plan (Modo Demo)"}
                </h3>
                {!isDemo ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                          Plan {tier}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-4xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Activo
                        </span>
                      </div>
                      <p className="text-3xs text-slate-400 mt-1 leading-normal">
                        {tier === "free" && "Límite de 3 contratos. Branding personalizado bloqueado."}
                        {tier === "starter" && "Límite de 10 contratos. Identidad de marca (logo/firma) desbloqueada."}
                        {tier === "pro" && "Contratos ilimitados, branding desbloqueado y características premium."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/plans")}
                      className="text-2xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-left cursor-pointer"
                    >
                      Cambiar Plan →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div 
                      onClick={() => setTier("free")}
                      className={`rounded-2xl border p-4 cursor-pointer flex flex-col gap-1 transition-all ${
                        tier === "free" 
                          ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-350 bg-white/40 dark:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Plan Gratuito</span>
                        <span className="text-2xs font-extrabold text-indigo-500">$0 MXN</span>
                      </div>
                      <p className="text-3xs text-slate-400 mt-1 leading-normal">
                        Ideal para empezar. Máx. 3 contratos. Branding personalizado bloqueado.
                      </p>
                    </div>

                    <div 
                      onClick={() => setTier("starter")}
                      className={`rounded-2xl border p-4 cursor-pointer flex flex-col gap-1 transition-all ${
                        tier === "starter" 
                          ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-350 bg-white/40 dark:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Plan Starter</span>
                        <span className="text-2xs font-extrabold text-indigo-500">$99 MXN</span>
                      </div>
                      <p className="text-3xs text-slate-400 mt-1 leading-normal">
                        Límite de 10 contratos. Identidad de marca (logo/firma) desbloqueada.
                      </p>
                    </div>

                    <div 
                      onClick={() => setTier("pro")}
                      className={`rounded-2xl border p-4 cursor-pointer flex flex-col gap-1 transition-all ${
                        tier === "pro" 
                          ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 ring-2 ring-indigo-500/20" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-350 bg-white/40 dark:bg-slate-900/40"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Plan Pro</span>
                        <span className="text-2xs font-extrabold text-emerald-500">$199 MXN</span>
                      </div>
                      <p className="text-3xs text-slate-400 mt-1 leading-normal">
                        Contratos ilimitados, branding desbloqueado y características premium.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-855 pt-4">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">Datos Generales</h3>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Nombre Completo Titular</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Héctor Guerrero"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="Ej. +525512345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Código Postal Fiscal</label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="Ej. 06700"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white font-mono"
                />
              </div>

              <div className="md:col-span-2 pt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!fullName) {
                      setError("El nombre completo es requerido.");
                      return;
                    }
                    setError("");
                    setCurrentStep(2);
                  }}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Siguiente Step
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="md:col-span-2">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">Datos Fiscales</h3>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">RFC Emisor (13 caracteres)</label>
                <input
                  type="text"
                  maxLength={13}
                  placeholder="Ej. GUEH860710MX3"
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  onBlur={handleRfcBlur}
                  className={`rounded-xl border bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:outline-none dark:text-white uppercase font-mono ${
                    rfcError ? "border-red-500 focus:border-red-500" : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                  }`}
                />
                {rfcError && (
                  <span className="text-3xs text-red-500 font-semibold">{rfcError}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Régimen Fiscal (Sat)</label>
                <select
                  value={regimenFiscal}
                  onChange={(e) => setRegimenFiscal(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white dark:bg-slate-950"
                >
                  <option value="">Selecciona una opción...</option>
                  <option value="626 - Régimen Simplificado de Confianza (RESICO)">626 - Régimen Simplificado de Confianza (RESICO)</option>
                  <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                  <option value="605 - Sueldos y Salarios e Ingresos Asimilados a Salarios">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                </select>
              </div>

              <div className="md:col-span-2 pt-5 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/45 dark:bg-slate-900/45 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-white font-bold px-6 py-2.5 text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (rfcError) {
                      setError("Por favor corrige el error del RFC.");
                      return;
                    }
                    setError("");
                    setCurrentStep(3);
                  }}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  Siguiente Step
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              {/* Section: Bank Details */}
              <div className="md:col-span-2">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Landmark className="h-4 w-4" /> Datos Bancarios (Para Transferencias)
                </h3>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Banco Receptor</label>
                <input
                  type="text"
                  placeholder="Ej. BBVA México o STP"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">CLABE Interbancaria (18 dígitos)</label>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="18 dígitos para SPEI"
                  value={clabe}
                  onChange={(e) => setClabe(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white font-mono"
                />
              </div>

              {/* Section: Custom Branding (Optional) */}
              <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-850 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">Identidad de Marca (Opcional)</h3>
                  {tier === "free" && (
                    <span className="text-3xs font-bold bg-amber-500/10 text-amber-600 rounded-md px-1.5 py-0.5 border border-amber-500/20">Requiere Plan Pro</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 relative">
                <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Logo de tu Empresa (PNG, JPG, SVG - Máx 2MB)</label>
                {tier === "free" ? (
                  <input
                    type="text"
                    disabled
                    placeholder="🔒 Carga de logo deshabilitada en Plan Gratuito"
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                ) : (
                  <div className="flex flex-col gap-2 text-left">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "logo")}
                      className="w-full text-xs text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-xl file:border-0
                        file:text-xs file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100"
                    />
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo preview" className="h-10 w-auto object-contain border border-slate-200 dark:border-slate-850 rounded-lg self-start" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5 relative">
                <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Tu Firma Digital (PNG, JPG - Máx 2MB)</label>
                {tier === "free" ? (
                  <input
                    type="text"
                    disabled
                    placeholder="🔒 Carga de firma deshabilitada en Plan Gratuito"
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                ) : (
                  <div className="flex flex-col gap-2 text-left">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "signature")}
                      className="w-full text-xs text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-xl file:border-0
                        file:text-xs file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100"
                    />
                    {signatureUrl && (
                      <img src={signatureUrl} alt="Firma preview" className="h-10 w-auto object-contain border border-slate-200 dark:border-slate-850 rounded-lg self-start" />
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-850 pt-5 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/45 dark:bg-slate-900/45 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-white font-bold px-6 py-2.5 text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Guardar Perfil y Empezar
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
