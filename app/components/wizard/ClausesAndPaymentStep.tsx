import { Info } from "lucide-react";
import { PaymentProfile, Profile } from "@/lib/types";
import { MOCK_CLAUSES } from "@/lib/mockData";

interface ClausesAndPaymentStepProps {
  selectedClauses: string[];
  handleToggleClause: (id: string) => void;
  paymentProfiles: PaymentProfile[];
  selectedProfileId: string;
  setSelectedProfileId: (id: string) => void;
  clabe: string;
  setClabe: (v: string) => void;
  bankName: string;
  setBankName: (v: string) => void;
  beneficiaryName: string;
  setBeneficiaryName: (v: string) => void;
  freelancerRfc: string;
  setFreelancerRfc: (v: string) => void;
  freelancerRegimen: string;
  setFreelancerRegimen: (v: string) => void;
  onBack: () => void;
  profile: Profile | null;
}

export function ClausesAndPaymentStep({
  selectedClauses, handleToggleClause,
  paymentProfiles, selectedProfileId, setSelectedProfileId,
  clabe, setClabe,
  bankName, setBankName,
  beneficiaryName, setBeneficiaryName,
  freelancerRfc, setFreelancerRfc,
  freelancerRegimen, setFreelancerRegimen,
  onBack,
  profile
}: ClausesAndPaymentStepProps) {
  return (
    <>
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
                className={`glass p-4 rounded-xl cursor-pointer transition-all border text-left flex gap-3 items-start ${ isChecked ? "border-indigo-500 bg-indigo-500/5" : "hover:border-slate-300 " }`}
              >
                <input 
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 pointer-events-none"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                    {clause.title}
                    <span className="text-3xs uppercase px-1 py-0.25 rounded bg-slate-100 text-slate-400 font-semibold">
                      {clause.category}
                    </span>
                    {clause.legalBasis && (
                      <span className="text-3xs flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        <Info className="h-3 w-3" />
                        Base Legal
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 font-light">
                    {clause.content}
                  </p>
                  {clause.legalBasis && (
                    <div className="mt-2 text-2xs bg-emerald-50 text-emerald-800/80 p-2 rounded-lg border border-emerald-500/20 font-medium">
                      <strong>Fundamento:</strong> {clause.legalBasis}
                    </div>
                  )}
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
            Los datos de tu perfil serán insertados en las firmas y la CLABE. Puedes modificarlos sólo para este contrato aquí o seleccionar un perfil de pago preestablecido.
          </p>
        </div>

        {paymentProfiles.length > 0 && (
          <div className="flex flex-col gap-1.5 text-left bg-white/40 p-4 rounded-xl border border-indigo-500/10">
            <label className="text-2xs font-extrabold text-indigo-500 uppercase tracking-widest">Perfil de Pago SPEI Rápido</label>
            <select
              value={selectedProfileId}
              onChange={(e) => {
                const pid = e.target.value;
                setSelectedProfileId(pid);
                const selected = paymentProfiles.find(p => p.id === pid);
                if (selected) {
                  setClabe(selected.clabe);
                  setBankName(selected.bankName);
                } else if (profile) {
                  setClabe(profile.bankDetails.clabe);
                  setBankName(profile.bankDetails.bankName);
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="">-- Datos de perfil por defecto --</option>
              {paymentProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.nickname} ({p.bankName} - {p.clabe.slice(-4)})</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Beneficiario / Titular</label>
            <input
              type="text"
              required
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/10 text-slate-800 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all shadow-inner"
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
              className="w-full rounded-xl border border-slate-200 bg-white/10 text-slate-800 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all shadow-inner"
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Banco</label>
            <input
              type="text"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/10 text-slate-800 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all shadow-inner"
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
              className="w-full rounded-xl border border-slate-200 bg-white/10 text-slate-800 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all shadow-inner"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tu Régimen Fiscal</label>
            <input
              type="text"
              required
              value={freelancerRegimen}
              onChange={(e) => setFreelancerRegimen(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/10 text-slate-800 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-300 bg-transparent px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
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
    </>
  );
}
