"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  Settings,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { 
  getProfile, 
  updateProfile,
  getContracts,
  uploadBrandAsset,
  getPaymentProfiles,
  savePaymentProfile,
  deletePaymentProfile
} from "@/lib/storageClient";
import { Profile, Contract, PaymentProfile } from "@/lib/types";
import { UpgradeAlert } from "@/app/components/UpgradeAlert";
import { AppShell } from "../../components/AppShell";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [paymentProfiles, setPaymentProfiles] = useState<PaymentProfile[]>([]);
  
  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [rfc, setRfc] = useState("");
  const [regimenFiscal, setRegimenFiscal] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [clabe, setClabe] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  
  // Branding States
  const [logoUrl, setLogoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
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
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      if (typeof window !== "undefined") {
        setIsDemo(localStorage.getItem("demo_mode") === "true");
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

      try {
        const profilesList = await getPaymentProfiles(prof.id);
        setPaymentProfiles(profilesList);
      } catch (err) {
        console.error("Error loading payment profiles:", err);
      }

      const allContracts = await getContracts();
      setContracts(allContracts);
      setLoading(false);
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

        {/* Section 3: Cuentas Bancarias */}
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
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 border border-emerald-500/20">
                  Activo
                </span>
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
        </section>

      </div>
    </div>
    </AppShell>
  );
}
