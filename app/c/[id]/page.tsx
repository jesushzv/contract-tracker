"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Download, 
  User, 
  AlertCircle,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Printer,
  Building,
  CreditCard
} from "lucide-react";
import { getContractById, getMilestones, acceptContract, markMilestoneAsTransferred, updateMilestoneStatus } from "@/lib/storageClient";
import { MOCK_CLAUSES } from "@/lib/mockData";
import { Contract, Milestone } from "@/lib/types";

export default function ClientContractView() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [copiedClabe, setCopiedClabe] = useState(false);
  
  // Modals state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [signerName, setSignerName] = useState("");
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMilestone, setPaymentMilestone] = useState<Milestone | null>(null);
  const [trackingReference, setTrackingReference] = useState("");
  const [transferredAmount, setTransferredAmount] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (contractId) {
        const c = await getContractById(contractId);
        setContract(c);
        if (c) {
          const mList = await getMilestones(c.id);
          setMilestones(mList);
        }
      }
    }
    loadData();
  }, [contractId]);

  const refreshData = async () => {
    const c = await getContractById(contractId);
    setContract(c);
    if (c) {
      const mList = await getMilestones(c.id);
      setMilestones(mList);
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
    
    try {
      const updated = await acceptContract(contractId, signerName);
      if (updated) {
        setContract(updated);
        const mList = await getMilestones(contractId);
        setMilestones(mList);
        setAcceptedSuccess(true);
        setTimeout(() => setAcceptedSuccess(false), 5000);
      }
    } catch (err) {
      alert("Error al firmar el contrato: " + err);
    } finally {
      setLoading(false);
      setShowAcceptModal(false);
    }
  };

  const handleOpenPaymentModal = (milestone: Milestone) => {
    setPaymentMilestone(milestone);
    setTrackingReference("");
    setTransferredAmount(milestone.amount);
    setShowPaymentModal(true);
  };

  const handleMarkAsTransferred = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMilestone || !trackingReference) return;
    
    setLoading(true);
    try {
      await markMilestoneAsTransferred(paymentMilestone.id, trackingReference, transferredAmount);
      await refreshData();
      setShowPaymentModal(false);
      setPaymentMilestone(null);
    } catch (err) {
      alert("Error al guardar referencia de transferencia: " + err);
    } finally {
      setLoading(false);
    }
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

  if (!contract) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-24 text-center">
        <div className="glass rounded-3xl p-8 flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h1 className="text-xl font-bold">Contrato No Encontrado</h1>
          <p className="text-sm text-slate-500">
            El enlace que ingresaste es inválido o el contrato ha sido eliminado por el freelancer.
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
            <button
              onClick={() => setShowAcceptModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
            >
              <ShieldCheck className="h-4 w-4" />
              Revisar y Firmar Aceptación
            </button>
          )}
        </div>
      </div>

      {/* Accepted success notification banner */}
      {acceptedSuccess && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-400 flex items-start gap-3 print:hidden animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">¡Contrato aceptado exitosamente!</span>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
              Hemos registrado la aceptación digital vinculante. Ya puedes proceder a realizar el pago del anticipo solicitado a continuación.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Document & Financial Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: The actual Contract Paper (printable) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-950 shadow-md border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 md:p-8 text-left print:shadow-none print:border-none print:p-0">
          
          {/* Header document representation */}
          <div className="flex flex-col gap-6 pb-6 border-b border-slate-100 dark:border-slate-900">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-black uppercase text-slate-800 dark:text-white tracking-tight">Propuesta de Contrato</h1>
                <p className="text-xs text-slate-400 font-mono mt-1">ID: {contract.id.substring(0, 18)}</p>
              </div>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase ring-1 ring-inset ${
                contract.status === 'accepted'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : contract.status === 'completed'
                  ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400'
                  : contract.status === 'sent'
                  ? 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400'
              }`}>
                {contract.status === 'draft' ? 'Borrador' : contract.status === 'sent' ? 'Pendiente' : contract.status === 'accepted' ? 'Firmado' : contract.status === 'completed' ? 'Completado' : 'Cancelado'}
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cláusula Primera: Objeto y Alcance del Trabajo</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-light whitespace-pre-line">
              {contract.scopeDescription}
            </p>
          </div>

          {/* Legal clauses */}
          <div className="py-6 border-b border-slate-100 dark:border-slate-900 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cláusula Segunda: Acuerdos Legales de Prestación</h3>
            <div className="flex flex-col gap-4">
              {MOCK_CLAUSES.map((clause, idx) => (
                <div key={clause.id} className="text-xs flex gap-2.5 items-start">
                  <span className="font-extrabold text-indigo-500">2.{idx + 1}</span>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{clause.title}</h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-light">{clause.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature log block */}
          <div className="py-6 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aceptación y Firmas Electrónicas</h3>
            
            {contract.status === 'accepted' || contract.status === 'completed' ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Aceptado Digitalmente por el Cliente (Acción del Servidor)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-500 dark:text-slate-400 mt-1 font-light">
                  <p>Firmante: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.acceptedByName}</span></p>
                  <p>Dirección IP: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.acceptedIp}</span></p>
                  <p>Fecha/Hora: <span className="font-semibold text-slate-700 dark:text-slate-300">{contract.acceptedAt ? new Date(contract.acceptedAt).toLocaleString('es-MX') : ''}</span></p>
                  <p className="col-span-1 sm:col-span-2 font-semibold">Integrity Hash Code (SHA-256):</p>
                </div>
                <div className="text-3xs font-mono bg-slate-100 dark:bg-slate-900/60 rounded p-2 text-slate-400 break-all select-all font-light">
                  {contract.contractHash}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 border-dashed p-6 text-center text-slate-400 text-xs font-light">
                Pendiente de firma de aceptación del Cliente. Presiona el botón en la parte superior para firmar electrónicamente.
              </div>
            )}
          </div>
          
          {/* Printable signature lines */}
          <div className="hidden print:grid grid-cols-2 gap-16 mt-20 pt-8 border-t border-slate-200">
            <div className="text-center">
              <div className="h-16"></div>
              <div className="border-t border-slate-300 pt-2 text-xs">
                <p className="font-bold text-slate-700">{contract.beneficiaryName}</p>
                {contract.freelancerRfc && <p className="text-slate-400 font-mono text-3xs">RFC: {contract.freelancerRfc}</p>}
                <p className="text-slate-400">Prestador de Servicios</p>
              </div>
            </div>
            <div className="text-center">
              <div className="h-16 flex items-center justify-center text-emerald-500 text-xs font-mono">
                {contract.status === 'accepted' && `ACEPTADO DIGITALMENTE - IP: ${contract.acceptedIp}`}
              </div>
              <div className="border-t border-slate-300 pt-2 text-xs">
                <p className="font-bold text-slate-700">{contract.acceptedByName || contract.clientName}</p>
                {contract.clientRfc && <p className="text-slate-400 font-mono text-3xs">RFC: {contract.clientRfc}</p>}
                <p className="text-slate-400">Cliente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Milestones & SPEI Clabe (Interactive) */}
        <div className="lg:col-span-4 flex flex-col gap-6 print:hidden">
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

          {/* Active invoice request */}
          {activePayment && (
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
          )}

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

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !signerName}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Firmando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Aceptar y Firmar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
