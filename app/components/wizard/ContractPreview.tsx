import { FileText, CheckCircle2, Info } from "lucide-react";
import { MOCK_CLAUSES } from "@/lib/mockData";

interface Milestone {
  label: string;
  pct: number;
  amount: number;
  dueDate: string;
}

interface ContractPreviewProps {
  clientName: string;
  totalAmount: number;
  currency: string;
  milestones: Milestone[];
  selectedClauses: string[];
}

export function ContractPreview({
  clientName,
  totalAmount,
  currency,
  milestones,
  selectedClauses
}: ContractPreviewProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="w-full h-full glass rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden bg-white/40">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-500/80" />
      
      <div className="flex items-center gap-2 text-indigo-500 font-bold mb-4">
        <FileText className="h-5 w-5" />
        <h2>Vista Previa del Contrato</h2>
      </div>

      <div className="flex flex-col gap-8 bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex-grow overflow-y-auto">
        {/* Header section */}
        <div className="border-b border-slate-100 pb-6 text-center">
          <h1 className="text-xl font-bold uppercase tracking-widest text-slate-900 mb-2">
            Contrato de Prestación de Servicios
          </h1>
          <p className="text-sm text-slate-500">
            Entre <span className="font-semibold text-slate-700">Tú (El Prestador)</span> y <span className="font-semibold text-slate-700">{clientName || "[Nombre del Cliente]"}</span>.
          </p>
        </div>

        {/* Milestones section */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
            I. Condiciones de Pago
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            El monto total pactado es de <strong className="text-slate-900">{formatMoney(totalAmount)}</strong>. Se realizará mediante los siguientes hitos:
          </p>
          
          <div className="flex flex-col gap-3">
            {milestones.length === 0 ? (
              <p className="text-sm italic text-slate-400">No hay hitos definidos.</p>
            ) : (
              milestones.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{m.label || `Hito ${idx + 1}`}</span>
                    <span className="text-xs text-slate-500">Fecha límite: {m.dueDate || "Sin fecha"}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-indigo-600">{formatMoney(m.amount)}</span>
                    <span className="block text-xs text-slate-500">{m.pct}% del total</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Clauses preview */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
            II. Cláusulas y Condiciones Legales
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-slate-600">
            {selectedClauses.length === 0 ? (
              <li className="italic text-slate-400">Ninguna cláusula seleccionada.</li>
            ) : (
              selectedClauses.map((clauseId) => {
                const clause = MOCK_CLAUSES.find(c => c.id === clauseId);
                if (!clause) return null;
                return (
                  <li key={clauseId} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
                        {clause.title}
                        {clause.legalBasis && (
                          <span className="text-3xs flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            <Info className="h-3 w-3" />
                            Base Legal
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2" title={clause.content}>{clause.content}</span>
                      {clause.legalBasis && (
                        <div className="mt-2 text-2xs bg-emerald-50 text-emerald-800/80 p-2 rounded-lg border border-emerald-500/20 font-medium">
                          <strong>Fundamento:</strong> {clause.legalBasis}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
        
        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          Este documento es una previsualización. Al crearlo, se generará una versión final y un enlace único.
        </div>
      </div>
    </div>
  );
}
