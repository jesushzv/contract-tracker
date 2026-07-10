"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Send, 
  Copy, 
  MessageCircle, 
  CreditCard, 
  AlertCircle, 
  Eye, 
  ChevronRight, 
  Download, 
  User, 
  Settings, 
  RefreshCw,
  TrendingUp,
  ExternalLink,
  Info
} from "lucide-react";
import { 
  getContracts, 
  getMilestones, 
  getProfile, 
  updateProfile, 
  saveContract, 
  updateMilestoneStatus 
} from "@/lib/storageClient";
import { Contract, Milestone, Profile } from "@/lib/types";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'accepted' | 'completed'>('all');
  
  // Settings profile form
  const [showSettings, setShowSettings] = useState(false);
  const [fullName, setFullName] = useState("");
  const [clabe, setClabe] = useState("");
  const [bankName, setBankName] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [rfc, setRfc] = useState("");
  const [regimenFiscal, setRegimenFiscal] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

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

      const allContracts = await getContracts();
      setContracts(allContracts);
      if (allContracts.length > 0) {
        setSelectedContract(allContracts[0]);
        const mList = await getMilestones(allContracts[0].id);
        setMilestones(mList);
      }
    }
    loadInitialData();
  }, []);

  const refreshData = async () => {
    const allContracts = await getContracts();
    setContracts(allContracts);
    if (selectedContract) {
      const updated = allContracts.find(c => c.id === selectedContract.id) || null;
      setSelectedContract(updated);
      if (updated) {
        const mList = await getMilestones(updated.id);
        setMilestones(mList);
      }
    }
  };

  const handleSelectContract = async (contract: Contract) => {
    setSelectedContract(contract);
    const mList = await getMilestones(contract.id);
    setMilestones(mList);
  };

  const handleUpdateMilestone = async (milestoneId: string, newStatus: 'pending' | 'requested' | 'marked_paid' | 'confirmed') => {
    await updateMilestoneStatus(milestoneId, newStatus);
    await refreshData();
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updated: Profile = {
      ...profile,
      fullName,
      rfc: rfc || undefined,
      regimenFiscal: regimenFiscal || undefined,
      codigoPostal: codigoPostal || undefined,
      bankDetails: {
        clabe,
        bankName,
        beneficiaryName
      }
    };
    await updateProfile(updated);
    setProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCopyLink = (contractId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/c/${contractId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(contractId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWhatsAppShareLink = (contract: Contract) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/c/${contract.id}`;
    const text = `Hola ${contract.clientName}, te comparto el contrato y esquema de anticipos para nuestro proyecto de "${contract.scopeDescription.substring(0, 40)}...". Puedes revisarlo y aceptarlo aquí: ${url}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // Filtered contracts
  const filteredContracts = contracts.filter(c => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  // Calculate Metrics
  const [metrics, setMetrics] = useState({ totalContracted: 0, totalPaid: 0, totalOutstanding: 0 });

  useEffect(() => {
    async function calculateMetrics() {
      let totalContracted = 0;
      let totalPaid = 0;
      let totalOutstanding = 0;

      for (const c of contracts) {
        const cMilestones = await getMilestones(c.id);
        cMilestones.forEach(m => {
          const amount = m.amount;
          const value = c.currency === 'USD' ? amount * 17 : amount; // display normalization
          totalContracted += value;
          if (m.status === 'marked_paid' || m.status === 'confirmed') {
            totalPaid += value;
          } else {
            totalOutstanding += value;
          }
        });
      }
      setMetrics({ totalContracted, totalPaid, totalOutstanding });
    }
    if (contracts.length > 0) {
      calculateMetrics();
    } else {
      setMetrics({ totalContracted: 0, totalPaid: 0, totalOutstanding: 0 });
    }
  }, [contracts]);

  const formatMoney = (amount: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Helper to check if milestone is overdue
  const isMilestoneOverdue = (milestone: Milestone) => {
    if (milestone.status === 'marked_paid' || milestone.status === 'confirmed') return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return milestone.dueDate < todayStr;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-8">
      {isDemo && (
        <div className="glass border-indigo-500/20 bg-indigo-500/5 text-indigo-800 dark:text-indigo-400 p-4 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0" />
            <span>
              <strong>Modo Demostración Activo:</strong> Los datos se guardan de forma 100% privada en tu navegador (localStorage). Si deseas usar la base de datos real del servidor, sal de la demostración.
            </span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("demo_mode");
              localStorage.removeItem("sandbox_profile");
              localStorage.removeItem("sandbox_contracts");
              localStorage.removeItem("sandbox_milestones");
              window.location.reload();
            }}
            type="button"
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 transition-colors whitespace-nowrap"
          >
            Salir de Demostración
          </button>
        </div>
      )}
      {/* Upper header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Panel de Control</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hola, <span className="font-semibold text-slate-700 dark:text-slate-300">{profile?.fullName}</span>. Gestiona tus contratos y SPEI anticipos activos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configurar RFC / CLABE
          </button>
          <Link
            href="/contracts/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Contrato
          </Link>
        </div>
      </div>

      {/* CLABE & Fiscal Config Overlay Drawer */}
      {showSettings && (
        <div className="glass rounded-3xl p-6 shadow-xl relative border-indigo-500/20 bg-white/90 dark:bg-slate-950/90 transition-all duration-300 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-500" />
            Configuración de Datos de Facturación y Cobro (SPEI)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Esta información se cargará por defecto al redactar tus contratos para garantizar tu validez fiscal (RESICO, Actividad Profesional) y facilitar las transferencias de tus clientes.
          </p>

          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo / Razón Social</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">RFC del Emisor</label>
              <input
                type="text"
                required
                maxLength={13}
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Código Postal Fiscal</label>
              <input
                type="text"
                required
                maxLength={5}
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Régimen Fiscal (SAT)</label>
              <select
                value={regimenFiscal}
                onChange={(e) => setRegimenFiscal(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
              >
                <option value="">Selecciona Régimen Fiscal</option>
                <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
                <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">612 - Actividad Empresarial y Profesional</option>
                <option value="626 - Régimen Simplificado de Confianza (RESICO)">626 - RESICO (Régimen Simplificado de Confianza)</option>
                <option value="605 - Sueldos y Salarios e Ingresos Asimilados">605 - Sueldos y Salarios</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Banco</label>
              <input
                type="text"
                required
                placeholder="Ej. BBVA, Santander"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">CLABE (18 dígitos)</label>
              <input
                type="text"
                required
                maxLength={18}
                value={clabe}
                onChange={(e) => setClabe(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <div className="md:col-span-4 flex items-center justify-between mt-2">
              {saveSuccess ? (
                <span className="text-sm text-emerald-500 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4" /> ¡Datos actualizados con éxito!
                </span>
              ) : <span />}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white px-5 py-2 text-sm font-semibold transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Metrics Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Contratado (Consolidado MXN)</span>
            <DollarSign className="h-4 w-4 text-indigo-500" />
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatMoney(metrics.totalContracted)}
          </dd>
          <div className="mt-1 text-xs text-slate-400">Total en todos tus contratos</div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Cobrado con Éxito</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatMoney(metrics.totalPaid)}
          </dd>
          <div className="mt-1 text-xs text-slate-400">
            {metrics.totalContracted > 0 
              ? `${Math.round((metrics.totalPaid / metrics.totalContracted) * 100)}% de efectividad`
              : '0% de efectividad'}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Por Cobrar / Pendiente</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {formatMoney(metrics.totalOutstanding)}
          </dd>
          <div className="mt-1 text-xs text-slate-400">Monto total por facturar / recibir</div>
        </div>
      </div>

      {/* Main Grid: Contracts & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
        {/* Left Column: Contracts list */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Tus Contratos</h2>
            <button 
              onClick={refreshData}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Sincronizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Filtering Tab buttons */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'all' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`pb-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'sent' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Enviados
            </button>
            <button
              onClick={() => setActiveTab('accepted')}
              className={`pb-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'accepted' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Aceptados
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'completed' 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Completados
            </button>
          </div>

          {/* List display */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px]">
            {filteredContracts.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center text-slate-400 text-sm">
                No se encontraron contratos en esta sección.
              </div>
            ) : (
              filteredContracts.map((contract) => (
                <div
                  key={contract.id}
                  onClick={() => handleSelectContract(contract)}
                  className={`glass rounded-xl p-4 cursor-pointer text-left transition-all ${
                    selectedContract?.id === contract.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                      : 'hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">
                      {contract.clientName}
                    </h3>
                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-2xs font-medium uppercase ring-1 ring-inset ${
                      contract.status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : contract.status === 'completed'
                        ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400'
                        : contract.status === 'sent'
                        ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400'
                    }`}>
                      {contract.status === 'draft' ? 'Borrador' : contract.status === 'sent' ? 'Enviado' : contract.status === 'accepted' ? 'Aceptado' : contract.status === 'completed' ? 'Completo' : 'Cancelado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {contract.scopeDescription}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                    <span className="text-xs text-slate-400">
                      {new Date(contract.created_at).toLocaleDateString('es-MX')}
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {formatMoney(contract.totalAmount, contract.currency)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Contract details tracker */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedContract ? (
            <div className="glass rounded-3xl p-6 flex flex-col gap-6 text-left animate-in fade-in-50 duration-300">
              {/* Detail Header */}
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
                  <Link
                    href={`/c/${selectedContract.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver de Cliente
                  </Link>
                </div>
              </div>

              {/* Status workflow banner */}
              {selectedContract.status === 'draft' && (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-800 dark:text-amber-400 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Estado: Borrador</span>. Este contrato aún no ha sido compartido oficialmente. Puedes realizar cambios o marcarlo como enviado para activar las solicitudes de anticipos.
                    <button
                      onClick={() => handleUpdateContractStatus('sent')}
                      className="mt-3 block bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                    >
                      Marcar como Enviado
                    </button>
                  </div>
                </div>
              )}

              {selectedContract.status === 'sent' && (
                <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 text-sm text-indigo-800 dark:text-indigo-400 flex items-start gap-3">
                  <Send className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Estado: Enviado (Pendiente de Aceptación)</span>. Envía el enlace al cliente para que revise el alcance y firme de aceptado electrónicamente.
                  </div>
                </div>
              )}

              {selectedContract.status === 'accepted' && (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-400 flex flex-col gap-1.5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Contrato Firmado / Aceptado</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Aceptado por: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedContract.acceptedByName}</span> • IP: {selectedContract.acceptedIp}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Fecha: {selectedContract.acceptedAt ? new Date(selectedContract.acceptedAt).toLocaleString('es-MX') : ''}
                      </p>
                    </div>
                  </div>
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

              {/* Scope Description */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alcance de Trabajo</span>
                <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-4 text-sm leading-relaxed border border-slate-100 dark:border-slate-800/50">
                  {selectedContract.scopeDescription}
                </div>
              </div>

              {/* Milestone Tracker Section */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Esquema de Anticipos e Hitos</span>
                  <span className="text-xs font-bold text-indigo-500">
                    Total: {formatMoney(selectedContract.totalAmount, selectedContract.currency)}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {milestones.map((milestone, idx) => {
                    const overdue = isMilestoneOverdue(milestone);
                    return (
                      <div 
                        key={milestone.id}
                        className="glass rounded-2xl p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-l-4 border-l-slate-300 data-[status=marked_paid]:border-l-emerald-500 data-[status=confirmed]:border-l-indigo-500 data-[status=requested]:border-l-amber-500 data-[overdue=true]:border-l-red-500"
                        data-status={milestone.status}
                        data-overdue={overdue}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-400">Hito #{idx + 1}</span>
                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.25 text-2xs font-semibold uppercase ring-1 ring-inset ${
                              milestone.status === 'confirmed'
                                ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400'
                                : milestone.status === 'marked_paid'
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : milestone.status === 'requested'
                                ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400'
                                : 'bg-slate-50 text-slate-600 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400'
                            }`}>
                              {milestone.status === 'pending' ? 'pendiente' : milestone.status === 'requested' ? 'solicitado' : milestone.status === 'marked_paid' ? 'pagado (verificando)' : 'confirmado'}
                            </span>
                            
                            {/* OVERDUE BADGE */}
                            {overdue && (
                              <span className="inline-flex items-center rounded-md bg-red-550/15 border border-red-500/20 px-1.5 py-0.25 text-2xs font-bold text-red-500 uppercase animate-pulse">
                                Atrasado
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{milestone.label}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                            <span className={overdue ? "text-red-500 font-bold" : ""}>
                              Vence: {new Date(milestone.dueDate).toLocaleDateString('es-MX')}
                            </span>
                            {milestone.markedPaidAt && (
                              <span className="text-emerald-500">• Transferido el: {new Date(milestone.markedPaidAt).toLocaleDateString('es-MX')}</span>
                            )}
                          </div>

                          {/* SPEI Tracking Reference details */}
                          {milestone.status === 'marked_paid' && milestone.trackingReference && (
                            <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs flex flex-col gap-1.5">
                              <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5" />
                                Detalle de Pago del Cliente:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 mt-1 font-light">
                                <p>Clave de Rastreo SPEI: <span className="font-bold font-mono text-slate-700 dark:text-slate-350 select-all">{milestone.trackingReference}</span></p>
                                {milestone.transferredAmount && (
                                  <p>Monto Declarado: <span className="font-bold text-slate-700 dark:text-slate-350">{formatMoney(milestone.transferredAmount, selectedContract.currency)}</span></p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-500/10">
                                <a 
                                  href={`https://www.banxico.org.mx/cep/`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1 text-2xs transition-colors"
                                >
                                  Verificar CEP en Banxico
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                            {formatMoney(milestone.amount, selectedContract.currency)}
                          </span>
                          
                          {/* Control buttons */}
                          <div className="flex items-center gap-1.5">
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
                                  onClick={() => handleUpdateMilestone(milestone.id, 'marked_paid')}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                                >
                                  Marcar como Pagado
                                </button>
                              </div>
                            )}
                            
                            {milestone.status === 'marked_paid' && (
                              <button
                                onClick={() => handleUpdateMilestone(milestone.id, 'confirmed')}
                                className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors shadow-md shadow-indigo-500/10"
                              >
                                Confirmar Recepción
                              </button>
                            )}

                            {(milestone.status === 'confirmed') && (
                              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                                Cobro Listo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
    </div>
  );
}
