import { ShieldCheck, Clock, CheckCircle2, Briefcase, Edit3, CreditCard } from "lucide-react";
import { Contract, Profile, AuditLog } from "@/lib/types";
import { MOCK_CLAUSES } from "@/lib/mockData";

interface ClientContractViewProps {
  contract: Contract;
  profile: Profile | null;
  auditLogs: AuditLog[];
  startProposingRevision: () => void;
}

export function ClientContractView({ contract, profile, auditLogs, startProposingRevision }: ClientContractViewProps) {
  return (
    <div className="lg:col-span-8 bg-white dark:bg-slate-950 shadow-md border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 md:p-8 text-left print:shadow-none print:border-none print:p-0">
      
      {/* Header document representation */}
      <div className="flex flex-col gap-6 pb-6 border-b border-slate-100 dark:border-slate-900">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            {profile?.logoUrl && (
              <img src={profile.logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-xl border border-slate-100 dark:border-slate-800 bg-white" />
            )}
            <div>
              <h1 className="text-2xl font-black uppercase text-slate-800 dark:text-white tracking-tight">Propuesta de Contrato</h1>
              <p className="text-xs text-slate-400 font-mono mt-1">ID: {contract.id.substring(0, 18)}</p>
            </div>
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
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-3xs">Cliente</span>
              {['sent', 'client_signed', 'accepted'].includes(contract.status) && (
                <button
                  onClick={startProposingRevision}
                  className="text-5xs font-extrabold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 uppercase transition-colors cursor-pointer"
                  title="Proponer cambios a datos de cliente"
                >
                  <Edit3 className="h-2.5 w-2.5" />
                  Editar
                </button>
              )}
            </div>
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
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Declaraciones & Alcance del Proyecto</h3>
          {['sent', 'client_signed', 'accepted'].includes(contract.status) && (
            <button
              onClick={startProposingRevision}
              className="text-5xs font-extrabold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 uppercase transition-colors cursor-pointer"
              title="Proponer cambios al alcance del proyecto"
            >
              <Edit3 className="h-2.5 w-2.5" />
              Editar
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-350 font-light whitespace-pre-wrap">{contract.scopeDescription}</p>
      </div>

      {/* Clause list */}
      <div className="py-6 border-b border-slate-100 dark:border-slate-900 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cláusulas Legales Generales</h3>
          {['sent', 'client_signed', 'accepted'].includes(contract.status) && (
            <button
              onClick={startProposingRevision}
              className="text-5xs font-extrabold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 uppercase transition-colors cursor-pointer"
              title="Proponer cambios a cláusulas legales"
            >
              <Edit3 className="h-2.5 w-2.5" />
              Editar
            </button>
          )}
        </div>
        <div className="flex flex-col gap-4 text-xs">
          {(() => {
            const renderedClauses = contract.selectedClauses && contract.selectedClauses.length > 0
              ? MOCK_CLAUSES.filter(c => contract.selectedClauses?.includes(c.id))
              : MOCK_CLAUSES;
            return renderedClauses.map((clause, idx) => (
              <div key={clause.id} className="flex gap-3">
                <span className="font-mono font-bold text-indigo-500 bg-indigo-500/5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{clause.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-light">{clause.content}</p>
                </div>
              </div>
            ));
          })()}
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
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs flex flex-col gap-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col gap-2">
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
              {profile?.signatureUrl && (
                <img src={profile.signatureUrl} alt="Firma Freelancer" className="max-h-12 object-contain bg-white rounded-lg p-1 border border-slate-100 dark:border-slate-800 dark:bg-slate-900/50" />
              )}
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
        <div className="text-center flex flex-col items-center justify-between min-h-[90px]">
          <div className="h-12 flex items-center justify-center">
            {contract.freelancerAcceptedAt ? (
              profile?.signatureUrl ? (
                <img src={profile.signatureUrl} alt="Firma Freelancer" className="max-h-12 object-contain" />
              ) : (
                <div className="text-[#10b981] text-3xs font-mono leading-tight">
                  [VALIDADO DIGITALMENTE]<br />
                  FECHA: {new Date(contract.freelancerAcceptedAt).toLocaleDateString('es-MX')}<br />
                  IP: {contract.freelancerAcceptedIp}
                </div>
              )
            ) : (
              <span className="text-3xs text-slate-300 italic">Pendiente de firma del Prestador</span>
            )}
          </div>
          <div className="w-full border-t border-slate-300 pt-2 text-xs">
            <p className="font-bold text-slate-700">{contract.beneficiaryName}</p>
            {contract.freelancerRfc && <p className="text-slate-400 font-mono text-3xs">RFC: {contract.freelancerRfc}</p>}
            <p className="text-slate-400">Prestador de Servicios</p>
          </div>
        </div>

        <div className="text-center flex flex-col items-center justify-between min-h-[90px]">
          <div className="h-12 flex items-center justify-center">
            {contract.acceptedAt ? (
              <div className="text-[#6366f1] text-3xs font-mono leading-tight">
                [FIRMADO ELECTRÓNICAMENTE]<br />
                FECHA: {new Date(contract.acceptedAt).toLocaleDateString('es-MX')}<br />
                IP: {contract.acceptedIp}<br />
                HASH: {contract.contractHash?.substring(0, 16)}...
              </div>
            ) : (
              <span className="text-3xs text-slate-300 italic">Pendiente de firma del Cliente</span>
            )}
          </div>
          <div className="w-full border-t border-slate-300 pt-2 text-xs">
            <p className="font-bold text-slate-700">{contract.acceptedByName || contract.clientName}</p>
            {contract.clientRfc && <p className="text-slate-400 font-mono text-3xs">RFC: {contract.clientRfc}</p>}
            <p className="text-slate-400">Cliente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
