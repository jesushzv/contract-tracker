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
  ExternalLink
} from "lucide-react";
import { getContractById, getMilestones, acceptContract, markMilestoneAsTransferred, getAuditLogs } from "@/lib/storageClient";
import { MOCK_CLAUSES } from "@/lib/mockData";
import { Contract, Milestone, AuditLog } from "@/lib/types";

export default function ClientContractView() {
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [copiedClabe, setCopiedClabe] = useState(false);
  
  // Modals state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [signerName, setSignerName] = useState("");
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMilestone, setPaymentMilestone] = useState<Milestone | null>(null);
  const [trackingReference, setTrackingReference] = useState("");
  const [transferredAmount, setTransferredAmount] = useState<number>(0);
  const [receiptUrl, setReceiptUrl] = useState("");
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
          const logs = await getAuditLogs(c.id);
          setAuditLogs(logs);
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
      const logs = await getAuditLogs(c.id);
      setAuditLogs(logs);
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
        const logs = await getAuditLogs(contractId);
        setAuditLogs(logs);
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
  };

  const handleOpenPaymentModal = (milestone: Milestone) => {
    setPaymentMilestone(milestone);
    setTrackingReference("");
    setTransferredAmount(milestone.amount);
    setReceiptUrl("");
    setShowPaymentModal(true);
  };

  const handleMarkAsTransferred = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMilestone || !trackingReference) return;
    
    setLoading(true);
    try {
      await markMilestoneAsTransferred(
        paymentMilestone.id,
        trackingReference,
        transferredAmount,
        receiptUrl || undefined
      );
      await refreshData();
      setShowPaymentModal(false);
      setPaymentMilestone(null);
    } catch (err) {
      alert("Error al guardar referencia de transferencia: " + err);
    } finally {
      setLoading(false);
    }
  };  // Find active requested payments
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
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-400 flex items-start gap-3 print:hidden animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">¡Contrato firmado exitosamente!</span>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
              Hemos registrado tu firma electrónica. El contrato se encuentra ahora en revisión final por parte del freelancer.
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
              {MOCK_CLAUSES.map((clause, idx) => (
                <div key={clause.id} className="flex gap-3">
                  <span className="font-mono font-bold text-indigo-500 bg-indigo-500/5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
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
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs flex flex-col gap-2">
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
            <div className="text-center">
              <div className="h-16"></div>
              <div className="border-t border-slate-300 pt-2 text-xs">
                <p className="font-bold text-slate-700">{contract.beneficiaryName}</p>
                {contract.freelancerRfc && <p className="text-slate-400 font-mono text-3xs">RFC: {contract.freelancerRfc}</p>}
                <p className="text-slate-400">Prestador de Servicios</p>
              </div>
            </div>
            <div className="text-center">
              <div className="h-16 flex items-center justify-center text-purple-500 text-xs font-mono">
                {contract.status !== 'draft' && contract.status !== 'sent' && `FIRMADO CLIENTE - IP: ${contract.acceptedIp}`}
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

              <div>
                <label className="block text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Comprobante de Pago (Enlace o Nombre de Archivo)</label>
                <input
                  type="text"
                  placeholder="Ej. https://dropbox.com/s/recibo.pdf o captura.png"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
                />
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
