import { useState } from "react";
import { ChevronRight, Building, ChevronDown, ChevronUp } from "lucide-react";

interface ClientDetailsStepProps {
  clientName: string;
  setClientName: (v: string) => void;
  clientEmail: string;
  setClientEmail: (v: string) => void;
  clientPhone: string;
  setClientPhone: (v: string) => void;
  clientRfc: string;
  setClientRfc: (v: string) => void;
  handleClientRfcBlur: () => void;
  clientRfcError: string;
  clientRegimen: string;
  setClientRegimen: (v: string) => void;
  clientPostal: string;
  setClientPostal: (v: string) => void;
  scopeDescription: string;
  setScopeDescription: (v: string) => void;
  onNext: () => void;
}

export function ClientDetailsStep({
  clientName, setClientName,
  clientEmail, setClientEmail,
  clientPhone, setClientPhone,
  clientRfc, setClientRfc,
  handleClientRfcBlur,
  clientRfcError,
  clientRegimen, setClientRegimen,
  clientPostal, setClientPostal,
  scopeDescription, setScopeDescription,
  onNext
}: ClientDetailsStepProps) {
  const [showFiscal, setShowFiscal] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Teléfono del Cliente (WhatsApp)</label>
          <input
            type="tel"
            placeholder="Ej. +525512345678"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Client MX Fiscal details (RFC, Regimen, CP) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 flex flex-col gap-4 bg-slate-50/20 dark:bg-slate-900/10 transition-all">
        <button 
          type="button" 
          onClick={() => setShowFiscal(!showFiscal)}
          className="text-xs font-extrabold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider transition-colors"
        >
          <Building className="h-4 w-4 text-slate-400" />
          Agregar Datos Fiscales del Cliente (Facturación)
          {showFiscal ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
        </button>
        
        {showFiscal && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">RFC del Cliente</label>
              <input
                type="text"
                maxLength={13}
                placeholder="Opcional (Ej. GAF1203058X4)"
                value={clientRfc}
                onChange={(e) => setClientRfc(e.target.value.toUpperCase())}
                onBlur={handleClientRfcBlur}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-1 focus:outline-none transition-all shadow-inner uppercase font-mono ${
                  clientRfcError ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-500/5" : "border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:ring-indigo-500"
                }`}
              />
              {clientRfcError && (
                <span className="text-3xs text-red-500 font-semibold mt-1 block">{clientRfcError}</span>
              )}
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
        )}
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
          onClick={() => {
            onNext();
          }}
          disabled={!clientName || !clientEmail || !scopeDescription || !!clientRfcError}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Siguiente Paso
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
