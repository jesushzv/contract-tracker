"use client";

import { useState, useEffect } from "react";
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
  Briefcase
} from "lucide-react";
import { 
  getContracts, 
  getMilestones, 
  getProfile, 
  updateProfile, 
  saveContract, 
  updateMilestoneStatus,
  getAuditLogs,
  vetAndAcceptContract
} from "@/lib/storageClient";
import { Contract, Milestone, Profile, AuditLog } from "@/lib/types";

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
    async function loadLogs() {
      if (selectedContract) {
        const logs = await getAuditLogs(selectedContract.id);
        setSelectedContractLogs(logs);
      } else {
        setSelectedContractLogs([]);
      }
    }
    loadLogs();
  }, [selectedContract, selectedContract?.status]);

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

  const handleVetAndCounterSign = async () => {
    if (!selectedContract) return;
    try {
      const updated = await vetAndAcceptContract(selectedContract.id, profile?.fullName || "Héctor J. Guerrero");
      if (updated) {
        await refreshData();
      }
    } catch (err) {
      alert("Error al validar y contra-firmar el contrato: " + err);
    }
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

  const handleCopyLink = (contractId: string) => {
    if (typeof window === "undefined") return;
    const clientUrl = `${window.location.origin}/c/${contractId}`;
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

  // Filter logic matching search text & filter tabs trigger
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
    const clientUrl = `${window.location.origin}/c/${c.id}`;
    const text = `Hola ${c.clientName}, te comparto la propuesta de contrato de servicios profesionales por un total de ${formatMoney(c.totalAmount, c.currency)}. Puedes revisarla y firmar de conformidad electrónicamente aquí: ${clientUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const totalOverdueMilestones = allMilestones.filter(m => isMilestoneOverdue(m)).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      {/* Dashboard Top Header bar */}
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

      {/* Fiscal settings toggle area */}
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

            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Perfil guardado con éxito
                </span>
              )}
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Left sidebar list & Right details panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Contracts navigation list */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {/* Real-time search bar */}
            <input
              type="text"
              placeholder="Buscar cliente, email o alcance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white placeholder:text-slate-400 shadow-sm"
            />

            {/* Filter triggers list */}
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

          {/* List display */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] pr-2">
            {filteredContracts.length === 0 ? (
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
                  <button
                    onClick={handleVetAndCounterSign}
                    className="w-full mt-2 rounded-xl bg-purple-600 hover:bg-purple-550 text-white font-bold py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/10"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Validar y Contra-firmar
                  </button>
                </div>
              )}

              {selectedContract.status === 'accepted' && (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-400 flex flex-col gap-2">
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

                        {/* CEP details if client transferred */}
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

                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-100 sm:border-t-0 pt-3 sm:pt-0">
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                            {formatMoney(milestone.amount, selectedContract.currency)}
                          </span>
                          
                          {/* Control buttons locked based on double countersigning flow */}
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

              {/* Detail drawer footer: Seal & Audit Logs */}
              <div className="border-t border-slate-100 dark:border-slate-850 pt-5 flex flex-col gap-6">
                {/* Verified Criptographic Seal Box */}
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

                {/* Audit Trail timeline */}
                {selectedContractLogs.length > 0 && (
                  <div className="flex flex-col gap-4 text-left">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Historial del Contrato (Audit Trail)</span>
                    
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
    </div>
  );
}
