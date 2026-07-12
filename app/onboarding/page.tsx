"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { updateProfile } from "@/lib/storageClient";
import { Profile } from "@/lib/types";
import { ShieldCheck, ArrowRight, AlertCircle, Loader2, Landmark } from "lucide-react";
import { validateRFC } from "@/lib/rfcValidator";

export default function OnboardingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [rfc, setRfc] = useState("");
  const [regimenFiscal, setRegimenFiscal] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [bankName, setBankName] = useState("");
  const [clabe, setClabe] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [tier, setTier] = useState<'free' | 'pro'>("free");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionCheckLoading, setSessionCheckLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const isDemo = new URLSearchParams(window.location.search).get("demo") === "true" || localStorage.getItem("demo_mode") === "true";
      if (isDemo) {
        setEmail("hector@freelancemx.dev");
        setSessionCheckLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setEmail(session.user.email || "");
      setSessionCheckLoading(false);
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
    
    // Strict RFC check
    const rfcCheck = validateRFC(rfc);
    if (!rfcCheck.isValid) {
      setError(rfcCheck.error || "RFC inválido");
      return;
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
        logoUrl: tier === "pro" ? (logoUrl || undefined) : undefined,
        signatureUrl: tier === "pro" ? (signatureUrl || undefined) : undefined,
        tier,
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Section: Plan Selection */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">Selecciona tu Plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  Ideal para empezar. Límite de 3 contratos y carga de identidad de marca (logo/firma) bloqueados.
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
                  <span className="text-2xs font-extrabold text-emerald-500">$199 MXN/mes</span>
                </div>
                <p className="text-3xs text-slate-400 mt-1 leading-normal">
                  Contratos ilimitados, logotipo y firma digital personalizados para una apariencia premium.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Fiscal Details */}
          <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-850 pt-4">
            <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3">Datos Fiscales</h3>
          </div>

          <div className="flex flex-col gap-1.5">
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

          {/* Section: Bank Details */}
          <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-850 pt-4">
            <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Landmark className="h-4 w-4" /> Datos Bancarios (Para Transferencias)
            </h3>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Banco Receptor</label>
            <input
              type="text"
              required
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
              required
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
            <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Logo de tu Empresa (URL de Imagen)</label>
            <input
              type="text"
              disabled={tier === "free"}
              placeholder={tier === "free" ? "🔒 Carga de logo deshabilitada en Plan Gratuito" : "https://tudominio.com/logo.png"}
              value={tier === "free" ? "" : logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Tu Firma Digital (URL de Imagen)</label>
            <input
              type="text"
              disabled={tier === "free"}
              placeholder={tier === "free" ? "🔒 Carga de firma deshabilitada en Plan Gratuito" : "https://tudominio.com/firma.png"}
              value={tier === "free" ? "" : signatureUrl}
              onChange={(e) => setSignatureUrl(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-850 pt-5 flex justify-end">
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
        </form>
      </div>
    </div>
  );
}
