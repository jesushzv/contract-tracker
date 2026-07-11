"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Info,
  Calendar,
  Layers,
  Percent,
  Building
} from "lucide-react";
import { MOCK_CLAUSES, CONTRACT_TEMPLATES } from "@/lib/mockData";
import { getProfile, saveContract, saveMilestones } from "@/lib/storageClient";
import { Contract, Milestone, Profile } from "@/lib/types";

function NewContractForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template");
  const [profile, setProfile] = useState<Profile | null>(null);

  // Stepper state
  const [step, setStep] = useState(1);

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientRfc, setClientRfc] = useState("");
  const [clientRegimen, setClientRegimen] = useState("");
  const [clientPostal, setClientPostal] = useState("");
  
  const [scopeDescription, setScopeDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState<number>(30000);
  const [currency, setCurrency] = useState<'MXN' | 'USD'>("MXN");
  const [selectedTemplate, setSelectedTemplate] = useState<'general' | 'design' | 'development' | 'consulting'>("general");

  // Dynamic Milestones
  const [milestones, setMilestones] = useState([
    { label: "Anticipo inicial (50%)", pct: 50, amount: 15000, dueDate: "" },
    { label: "Entrega y finiquito (50%)", pct: 50, amount: 15000, dueDate: "" }
  ]);

  // Selected Legal Clauses
  const [selectedClauses, setSelectedClauses] = useState<string[]>(CONTRACT_TEMPLATES.general.defaultClauses);

  // SPEI details (pre-populated from profile)
  const [clabe, setClabe] = useState("");
  const [bankName, setBankName] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");

  // Fiscal details (pre-populated from profile)
  const [freelancerRfc, setFreelancerRfc] = useState("");
  const [freelancerRegimen, setFreelancerRegimen] = useState("");
  const [freelancerPostal, setFreelancerPostal] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const prof = await getProfile();
      setProfile(prof);
      setClabe(prof.bankDetails.clabe);
      setBankName(prof.bankDetails.bankName);
      setBeneficiaryName(prof.bankDetails.beneficiaryName);
      setFreelancerRfc(prof.rfc || "");
      setFreelancerRegimen(prof.regimenFiscal || "");
      setFreelancerPostal(prof.codigoPostal || "");
    }
    loadProfile();
  }, []);

  useEffect(() => {
    if (templateParam && ["general", "design", "development", "consulting"].includes(templateParam)) {
      handleTemplateChange(templateParam as any);
    }
  }, [templateParam]);

  // Update clause selection when template changes
  const handleTemplateChange = (tmplKey: 'general' | 'design' | 'development' | 'consulting') => {
    setSelectedTemplate(tmplKey);
    setSelectedClauses(CONTRACT_TEMPLATES[tmplKey].defaultClauses);

    // Dynamic milestones load based on selected template type
    let newMilestones: Array<{ label: string; pct: number; amount: number; dueDate: string }> = [];
    if (tmplKey === 'general') {
      newMilestones = [
        { label: "Anticipo inicial (50%)", pct: 50, amount: Math.round(totalAmount * 0.5), dueDate: "" },
        { label: "Entrega y finiquito (50%)", pct: 50, amount: Math.round(totalAmount * 0.5), dueDate: "" }
      ];
    } else if (tmplKey === 'design') {
      newMilestones = [
        { label: "Anticipo contra firma (40%)", pct: 40, amount: Math.round(totalAmount * 0.4), dueDate: "" },
        { label: "Entrega de propuestas conceptuales (30%)", pct: 30, amount: Math.round(totalAmount * 0.3), dueDate: "" },
        { label: "Entrega final y finiquito (30%)", pct: 30, amount: Math.round(totalAmount * 0.3), dueDate: "" }
      ];
    } else if (tmplKey === 'development') {
      newMilestones = [
        { label: "Anticipo contra inicio (30%)", pct: 30, amount: Math.round(totalAmount * 0.3), dueDate: "" },
        { label: "Entrega de versión Beta funcional (40%)", pct: 40, amount: Math.round(totalAmount * 0.4), dueDate: "" },
        { label: "Despliegue a producción y finiquito (30%)", pct: 30, amount: Math.round(totalAmount * 0.3), dueDate: "" }
      ];
    } else if (tmplKey === 'consulting') {
      newMilestones = [
        { label: "Pago único de honorarios (100%)", pct: 100, amount: totalAmount, dueDate: "" }
      ];
    }
    setMilestones(newMilestones);
  };

  // Recalculate milestone values based on total amount
  const handleTotalAmountChange = (amount: number) => {
    setTotalAmount(amount);
    setMilestones(prev => 
      prev.map(m => ({
        ...m,
        amount: Math.round((m.pct / 100) * amount)
      }))
    );
  };

  const handleMilestonePctChange = (index: number, pct: number) => {
    setMilestones(prev => {
      const updated = [...prev];
      updated[index].pct = pct;
      updated[index].amount = Math.round((pct / 100) * totalAmount);
      return updated;
    });
  };

  const handleAddMilestone = () => {
    const defaultPct = 20;
    const defaultAmount = Math.round((defaultPct / 100) * totalAmount);
    setMilestones(prev => [
      ...prev,
      { label: `Hito de pago #${prev.length + 1}`, pct: defaultPct, amount: defaultAmount, dueDate: "" }
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleToggleClause = (clauseId: string) => {
    setSelectedClauses(prev => 
      prev.includes(clauseId) 
        ? prev.filter(id => id !== clauseId) 
        : [...prev, clauseId]
    );
  };

  // Strict Balance Verification
  const getMilestoneSum = () => {
    return milestones.reduce((sum, m) => sum + m.amount, 0);
  };

  const getMilestonePctSum = () => {
    return milestones.reduce((sum, m) => sum + m.pct, 0);
  };

  const isBalanceValid = () => {
    return getMilestoneSum() === totalAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // 1. Strict mathematical verification
    if (!isBalanceValid()) {
      alert(`Error de validación financiera: La suma de los montos de los hitos (${getMilestoneSum()} ${currency}) debe ser exactamente igual al monto total del contrato (${totalAmount} ${currency}). Por favor, ajusta los importes de tus hitos.`);
      return;
    }

    const contractId = `c-${Date.now()}`;
    
    // 2. Save Contract Server Action
    const contractObj: Contract = {
      id: contractId,
      freelancerId: profile.id,
      clientName,
      clientEmail,
      clientRfc: clientRfc || undefined,
      clientRegimen: clientRegimen || undefined,
      clientPostal: clientPostal || undefined,
      
      scopeDescription,
      totalAmount,
      currency,
      status: 'sent', // Marks directly as Sent to client
      clabe,
      bankName,
      beneficiaryName,
      
      freelancerRfc: freelancerRfc || undefined,
      freelancerRegimen: freelancerRegimen || undefined,
      freelancerPostal: freelancerPostal || undefined,
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await saveContract(contractObj);

    // 3. Save Milestones Server Action
    const milestoneObjs: Milestone[] = milestones.map((m, idx) => ({
      id: `m-${contractId}-${idx}`,
      contractId: contractId,
      label: m.label,
      amount: m.amount,
      dueDate: m.dueDate || new Date(Date.now() + (idx + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: idx === 0 ? 'requested' : 'pending', // First milestone requested automatically (Anticipo)
      created_at: new Date().toISOString()
    }));
    await saveMilestones(milestoneObjs);

    router.push("/dashboard");
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-6">
      {/* Return to Dashboard */}
      <div>
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Panel
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Crear Nuevo Contrato</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Redacta propuestas formales con hitos de cobro y garantías legales en minutos.
          </p>
        </div>

        {/* Custom Step indicator */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500">
          <span className={step === 1 ? "text-indigo-600 dark:text-indigo-400" : ""}>1. Detalles</span>
          <ChevronRight className="h-3 w-3" />
          <span className={step === 2 ? "text-indigo-600 dark:text-indigo-400" : ""}>2. Esquema Financiero</span>
          <ChevronRight className="h-3 w-3" />
          <span className={step === 3 ? "text-indigo-600 dark:text-indigo-400" : ""}>3. Cláusulas y SPEI</span>
        </div>
      </div>

      {/* Contract Creation Form */}
      <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-left">
        
        {/* STEP 1: Client details & Scope */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
            <h2 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Información de la Propuesta
            </h2>

            {/* Template Select Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Selecciona una Plantilla de Servicio (Carga cláusulas predeterminadas)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {(Object.keys(CONTRACT_TEMPLATES) as Array<keyof typeof CONTRACT_TEMPLATES>).map((key) => {
                  const item = CONTRACT_TEMPLATES[key];
                  const isSelected = selectedTemplate === key;
                  return (
                    <div
                      key={key}
                      onClick={() => handleTemplateChange(key)}
                      className={`glass p-4 rounded-xl cursor-pointer transition-all text-left flex flex-col justify-between h-32 border-2 ${
                        isSelected 
                          ? "border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/5 ring-2 ring-indigo-500/10" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <h3 className="font-bold text-sm text-slate-800 dark:text-white">{item.name}</h3>
                      <p className="text-2xs text-slate-400 leading-normal mt-1">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nombre del Cliente o Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sofía Garza, S.A. de C.V."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email del Cliente</label>
                <input
                  type="email"
                  required
                  placeholder="sofia@empresa.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Client MX Fiscal details (RFC, Regimen, CP) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 flex flex-col gap-4 bg-slate-50/20 dark:bg-slate-900/10">
              <h3 className="text-xs font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <Building className="h-4 w-4 text-slate-400" />
                Datos Fiscales del Cliente (Para la factura / CFDI)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">RFC del Cliente</label>
                  <input
                    type="text"
                    maxLength={13}
                    placeholder="Opcional (Ej. GAF1203058X4)"
                    value={clientRfc}
                    onChange={(e) => setClientRfc(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                  />
                </div>
                
                <div>
                  <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Régimen Fiscal (SAT)</label>
                  <select
                    value={clientRegimen}
                    onChange={(e) => setClientRegimen(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner dark:bg-slate-900"
                  >
                    <option value="">Opcional (Selecciona Régimen)</option>
                    <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
                    <option value="603 - Personas Morales con Fines no Lucrativos">603 - Fines no Lucrativos</option>
                    <option value="612 - Personas Físicas con Actividades Empresariales">612 - Activ. Empresarial / Profesional</option>
                    <option value="625 - Régimen de las Actividades Agrícolas, Ganaderas">625 - AGAPES</option>
                    <option value="626 - Régimen Simplificado de Confianza (RESICO)">626 - RESICO (Personas Físicas)</option>
                    <option value="605 - Sueldos y Salarios e Ingresos Asimilados">605 - Sueldos y Salarios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">CP Domicilio Fiscal</label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="Opcional (5 dígitos)"
                    value={clientPostal}
                    onChange={(e) => setClientPostal(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Descripción del Alcance / Servicios</label>
              <textarea
                required
                rows={5}
                placeholder="Describe detalladamente los entregables del proyecto. Escribe un texto claro y preciso sobre lo que el cliente va a recibir..."
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner leading-relaxed"
              />
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!clientName || !clientEmail || !scopeDescription}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                Siguiente Paso
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Esquema Financiero (Total and Milestones) */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
            <h2 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              Presupuesto e Hitos de Cobro
            </h2>

            {/* Total Budget Row */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Moneda del Contrato</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'MXN' | 'USD')}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner dark:bg-slate-900"
                  >
                    <option value="MXN">Peso Mexicano (MXN)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Monto Total del Proyecto</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      required
                      min={100}
                      value={totalAmount === 0 ? "" : totalAmount}
                      onChange={(e) => handleTotalAmountChange(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 pl-8 pr-4 py-2.5 text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Full-width Tip card */}
              <div className="rounded-xl border border-indigo-500/10 bg-indigo-550/5 dark:bg-indigo-500/5 p-4 text-xs text-slate-550 dark:text-slate-350 leading-relaxed flex items-center gap-2">
                <Info className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0" />
                <span>
                  Tip: El primer hito suele ser un <strong>Anticipo</strong> (30% - 50%) cobrado antes de iniciar labores.
                </span>
              </div>
            </div>

            {/* Strict balance check indicator banner */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs leading-relaxed transition-all duration-300 ${
              isBalanceValid() 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-400"
            }`}>
              {isBalanceValid() ? (
                <>
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                  <div>
                    <span className="font-bold">¡Balance Correcto!</span> La suma de los hitos es exactamente igual al total del contrato: <strong>{formatMoney(getMilestoneSum(), currency)}</strong> ({getMilestonePctSum()}%).
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                  <div>
                    <span className="font-bold">Suma Incorrecta:</span> La suma de los hitos es <strong>{formatMoney(getMilestoneSum(), currency)}</strong> ({getMilestonePctSum()}%). Falta o excede <strong>{formatMoney(Math.abs(totalAmount - getMilestoneSum()), currency)}</strong> para coincidir exactamente con el total de <strong>{formatMoney(totalAmount, currency)}</strong>.
                  </div>
                </>
              )}
            </div>

            {/* Milestones list */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Cronograma de Cobro</h3>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar Hito
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {milestones.map((milestone, index) => (
                  <div key={index} className="glass p-4 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-l-4 border-l-indigo-400">
                    <div className="md:col-span-5">
                      <label className="block text-2xs font-semibold text-slate-400 uppercase mb-1">Concepto del Hito</label>
                      <input
                        type="text"
                        required
                        value={milestone.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMilestones(prev => {
                            const updated = [...prev];
                            updated[index].label = val;
                            return updated;
                          });
                        }}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-2xs font-semibold text-slate-400 uppercase mb-1">Porcentaje</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min={0}
                          max={100}
                          step="any"
                          value={milestone.pct === 0 ? "" : milestone.pct}
                          onChange={(e) => handleMilestonePctChange(index, Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 pl-4 pr-8 py-2 text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                        />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-2xs font-semibold text-slate-400 uppercase mb-1">Monto calculado</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          required
                          value={milestone.amount === 0 ? "" : milestone.amount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setMilestones(prev => {
                              const updated = [...prev];
                              updated[index].amount = val;
                              updated[index].pct = totalAmount > 0 ? Math.round((val / totalAmount) * 1000) / 10 : 0;
                              return updated;
                            });
                          }}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 pl-7 pr-4 py-2 text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-2xs font-semibold text-slate-400 uppercase mb-1">Fecha Límite</label>
                      <input
                        type="date"
                        required
                        value={milestone.dueDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMilestones(prev => {
                            const updated = [...prev];
                            updated[index].dueDate = val;
                            return updated;
                          });
                        }}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                      />
                    </div>

                    <div className="md:col-span-1 flex justify-center pt-2 md:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(index)}
                        disabled={milestones.length <= 1}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors p-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!isBalanceValid()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                Siguiente Paso
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Cláusulas legales y SPEI config */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-in fade-in-50 duration-200">
            <h2 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Legalidades y Cobro (SPEI)
            </h2>

            {/* Legal Clause Selection Checklist */}
            <div className="flex flex-col gap-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Selecciona las Cláusulas para el Contrato (MX legal-ready)
              </label>
              
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                {MOCK_CLAUSES.map((clause) => {
                  const isChecked = selectedClauses.includes(clause.id);
                  return (
                    <div 
                      key={clause.id}
                      onClick={() => handleToggleClause(clause.id)}
                      className={`glass p-4 rounded-xl cursor-pointer transition-all border text-left flex gap-3 items-start ${
                        isChecked
                          ? "border-indigo-500 bg-indigo-500/5"
                          : "hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 pointer-events-none"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          {clause.title}
                          <span className="text-3xs uppercase px-1 py-0.25 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-semibold">
                            {clause.category}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1 font-light">
                          {clause.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SPEI and Fiscal Snapshot verification */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-indigo-500 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Datos Fiscales y Bancarios a Vincular (Tus datos)
                </h3>
                <p className="text-2xs text-slate-400 leading-normal mt-1">
                  Los datos de tu perfil serán insertados en las firmas y la CLABE. Puedes modificarlos sólo para este contrato aquí.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Beneficiario / Titular</label>
                  <input
                    type="text"
                    required
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Clabe Interbancaria</label>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    value={clabe}
                    onChange={(e) => setClabe(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Banco</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tu RFC (SAT)</label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    value={freelancerRfc}
                    onChange={(e) => setFreelancerRfc(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tu Régimen Fiscal</label>
                  <input
                    type="text"
                    required
                    value={freelancerRegimen}
                    onChange={(e) => setFreelancerRegimen(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6 mt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Volver
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/15 transition-all duration-200"
              >
                Crear y Activar Contrato
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default function NewContract() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
      </div>
    }>
      <NewContractForm />
    </Suspense>
  );
}

const formatMoney = (amount: number, currency: string = 'MXN') => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency
  }).format(amount);
};
