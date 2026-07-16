"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  ChevronRight, 
  ShieldAlert
} from "lucide-react";
import { getProfile, saveContract, saveMilestones, getContracts, getPaymentProfiles } from "@/lib/storageClient";
import { Contract, Milestone, Profile, PaymentProfile } from "@/lib/types";
import { AppShell } from "@/app/components/AppShell";

// Import new components
import { useContractWizard } from "@/app/hooks/useContractWizard";
import { TemplateGallery } from "@/app/components/wizard/TemplateGallery";
import { ClientDetailsStep } from "@/app/components/wizard/ClientDetailsStep";
import { FinancialSchemeStep } from "@/app/components/wizard/FinancialSchemeStep";
import { ClausesAndPaymentStep } from "@/app/components/wizard/ClausesAndPaymentStep";
import { ContractPreview } from "@/app/components/wizard/ContractPreview";

function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function NewContractForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template");
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paymentProfiles, setPaymentProfiles] = useState<PaymentProfile[]>([]);
  const [contractsCount, setContractsCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      const prof = await getProfile();
      setProfile(prof);
      
      const profilesList = await getPaymentProfiles(prof.id);
      setPaymentProfiles(profilesList);

      const contracts = await getContracts();
      const userContracts = contracts.filter(c => c.freelancerId === prof.id);
      setContractsCount(userContracts.length);
    }
    loadData();
  }, []);

  const wizard = useContractWizard(profile, paymentProfiles, templateParam);
  
  // Enforce contract limits based on tier
  const hasReachedLimit = 
    profile && (
      ((!profile.tier || profile.tier === "free") && contractsCount >= 3) ||
      (profile.tier === "starter" && contractsCount >= 10)
    );

  if (hasReachedLimit) {
    const isStarter = profile.tier === "starter";
    const currentLimit = isStarter ? 10 : 3;
    const nextPlanName = isStarter ? "Plan Pro" : "Plan Starter";
    const nextPlanCost = isStarter ? "$199 MXN/mes" : "$99 MXN/mes";
    const nextPlanFeatures = isStarter 
      ? "Contratos ilimitados + Conciliación SPEI" 
      : "Hasta 10 contratos activos + Logotipo/Firma";

    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center flex-grow flex items-center justify-center min-h-[70vh]">
        <div className="glass rounded-3xl p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden text-left flex flex-col gap-6 w-full">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
          
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Límite del Plan Alcanzado</h1>
              <p className="text-xs text-slate-400 mt-0.5">Límite de contratos para tu plan activo</p>
            </div>
          </div>

          <div className="text-sm leading-relaxed text-slate-500 flex flex-col gap-3 font-light">
            <p>
              Has alcanzado el límite máximo de **{currentLimit} contratos** permitidos en tu **Plan {isStarter ? "Starter" : "Gratuito"}**.
            </p>
            <p>
              Para crear más acuerdos de servicio con tus clientes y habilitar todas las funcionalidades avanzadas, te invitamos a mejorar tu plan.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 flex justify-between items-center mt-2">
            <div>
              <span className="font-bold text-sm text-slate-800">{nextPlanName}</span>
              <p className="text-3xs text-slate-400 mt-0.5">{nextPlanFeatures}</p>
            </div>
            <span className="text-xs font-black text-emerald-500">{nextPlanCost}</span>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5 mt-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-650 px-5 py-2.5 text-xs font-bold transition-all cursor-pointer"
            >
              Volver al Panel
            </Link>
            <Link
              href="/plans"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 text-xs transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center gap-1.5"
            >
              Ver Planes de Actualización
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!wizard.isBalanceValid()) {
      alert(`Error de validación financiera: La suma de los montos de los hitos (${wizard.getMilestoneSum()} ${wizard.currency}) debe ser exactamente igual al monto total del contrato (${wizard.totalAmount} ${wizard.currency}). Por favor, ajusta los importes de tus hitos.`);
      return;
    }

    const contractId = generateUUID();
    
    const contractObj: Contract = {
      id: contractId,
      freelancerId: profile.id,
      clientName: wizard.clientName,
      clientEmail: wizard.clientEmail,
      clientRfc: wizard.clientRfc || undefined,
      clientRegimen: wizard.clientRegimen || undefined,
      clientPostal: wizard.clientPostal || undefined,
      clientPhone: wizard.clientPhone || undefined,
      
      scopeDescription: wizard.scopeDescription,
      totalAmount: wizard.totalAmount,
      currency: wizard.currency,
      status: 'sent', 
      clabe: wizard.clabe,
      bankName: wizard.bankName,
      beneficiaryName: wizard.beneficiaryName,
      
      freelancerRfc: wizard.freelancerRfc || undefined,
      freelancerRegimen: wizard.freelancerRegimen || undefined,
      freelancerPostal: wizard.freelancerPostal || undefined,
      
      retencionIsr: wizard.retencionIsr,
      retencionIva: wizard.retencionIva,
      taxWithholdingAmount: (wizard.retencionIsr ? wizard.totalAmount * 0.10 : 0) + (wizard.retencionIva ? wizard.totalAmount * 0.16 * (2 / 3) : 0),
      ivaAmount: wizard.totalAmount * 0.16,
      subtotalAmount: wizard.totalAmount,
      clientOtpVerified: false,
      paymentProfileId: wizard.selectedProfileId || undefined,
      selectedClauses: wizard.selectedClauses,
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await saveContract(contractObj);

    const milestoneObjs: Milestone[] = wizard.milestones.map((m, idx) => ({
      id: generateUUID(),
      contractId: contractId,
      label: m.label,
      amount: m.amount,
      dueDate: m.dueDate || new Date(Date.now() + (idx + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: idx === 0 ? 'requested' : 'pending',
      created_at: new Date().toISOString()
    }));
    await saveMilestones(milestoneObjs);

    router.push("/dashboard");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-6">
      {/* Return to Dashboard */}
      <div>
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Panel
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Crear Nuevo Contrato</h1>
          <p className="text-sm text-slate-500 mt-1">
            Redacta propuestas formales con hitos de cobro y garantías legales en minutos.
          </p>
        </div>

        {/* Custom Step indicator */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500">
          <span className={wizard.step === 1 ? "text-indigo-600 " : ""}>1. Detalles</span>
          <ChevronRight className="h-3 w-3" />
          <span className={wizard.step === 2 ? "text-indigo-600 " : ""}>2. Esquema Financiero</span>
          <ChevronRight className="h-3 w-3" />
          <span className={wizard.step === 3 ? "text-indigo-600 " : ""}>3. Cláusulas y SPEI</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full lg:min-h-[600px]">
        {/* Left pane: Form Steps */}
        <div className="w-full lg:w-3/5">
          <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-left">
            {wizard.step === 1 && (
              <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
                <TemplateGallery 
                  selectedTemplate={wizard.selectedTemplate}
                  onSelectTemplate={wizard.setSelectedTemplate}
                />
                <ClientDetailsStep 
                  clientName={wizard.clientName} setClientName={wizard.setClientName}
                  clientEmail={wizard.clientEmail} setClientEmail={wizard.setClientEmail}
                  clientPhone={wizard.clientPhone} setClientPhone={wizard.setClientPhone}
                  clientRfc={wizard.clientRfc} setClientRfc={wizard.setClientRfc}
                  clientRegimen={wizard.clientRegimen} setClientRegimen={wizard.setClientRegimen}
                  clientPostal={wizard.clientPostal} setClientPostal={wizard.setClientPostal}
                  clientRfcError={wizard.clientRfcError}
                  handleClientRfcBlur={wizard.handleClientRfcBlur}
                  scopeDescription={wizard.scopeDescription} setScopeDescription={wizard.setScopeDescription}
                  onNext={() => wizard.setStep(2)}
                />
              </div>
            )}

            {wizard.step === 2 && (
              <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
                <FinancialSchemeStep 
                  currency={wizard.currency} setCurrency={wizard.setCurrency}
                  totalAmount={wizard.totalAmount} setTotalAmount={wizard.setTotalAmount}
                  retencionIsr={wizard.retencionIsr} setRetencionIsr={wizard.setRetencionIsr}
                  retencionIva={wizard.retencionIva} setRetencionIva={wizard.setRetencionIva}
                  milestones={wizard.milestones}
                  setMilestoneField={wizard.setMilestoneField}
                  handleMilestonePctChange={wizard.handleMilestonePctChange}
                  handleAddMilestone={wizard.handleAddMilestone}
                  handleRemoveMilestone={wizard.handleRemoveMilestone}
                  isBalanceValid={wizard.isBalanceValid}
                  getMilestoneSum={wizard.getMilestoneSum}
                  getMilestonePctSum={wizard.getMilestonePctSum}
                  onBack={() => wizard.setStep(1)}
                  onNext={() => wizard.setStep(3)}
                />
              </div>
            )}

            {wizard.step === 3 && (
              <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
                <ClausesAndPaymentStep
                  selectedClauses={wizard.selectedClauses} handleToggleClause={wizard.handleToggleClause}
                  paymentProfiles={paymentProfiles} 
                  selectedProfileId={wizard.selectedProfileId} setSelectedProfileId={wizard.setSelectedProfileId}
                  clabe={wizard.clabe} setClabe={wizard.setClabe}
                  bankName={wizard.bankName} setBankName={wizard.setBankName}
                  beneficiaryName={wizard.beneficiaryName} setBeneficiaryName={wizard.setBeneficiaryName}
                  freelancerRfc={wizard.freelancerRfc} setFreelancerRfc={wizard.setFreelancerRfc}
                  freelancerRegimen={wizard.freelancerRegimen} setFreelancerRegimen={wizard.setFreelancerRegimen}
                  onBack={() => wizard.setStep(2)}
                  profile={profile}
                />
              </div>
            )}
          </form>
        </div>
        
        {/* Right pane: Live Preview */}
        <div className="hidden lg:block w-full lg:w-2/5 sticky top-24 h-[calc(100vh-120px)]">
          <ContractPreview 
            clientName={wizard.clientName}
            totalAmount={wizard.totalAmount}
            currency={wizard.currency}
            milestones={wizard.milestones}
            selectedClauses={wizard.selectedClauses}
          />
        </div>
      </div>
    </div>
  );
}

export default function NewContractPage() {
  return (
    <AppShell activePath="/contracts/new">
      <Suspense fallback={<div className="flex items-center justify-center p-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
        <NewContractForm />
      </Suspense>
    </AppShell>
  );
}
