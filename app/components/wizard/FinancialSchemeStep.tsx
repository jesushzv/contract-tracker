import { Info, CheckCircle2, AlertCircle, Plus, Percent, Trash2, ChevronRight } from "lucide-react";

interface Milestone {
  label: string;
  pct: number;
  amount: number;
  dueDate: string;
}

interface FinancialSchemeStepProps {
  currency: 'MXN' | 'USD';
  setCurrency: (v: 'MXN' | 'USD') => void;
  totalAmount: number;
  setTotalAmount: (v: number) => void;
  retencionIsr: boolean;
  setRetencionIsr: (v: boolean) => void;
  retencionIva: boolean;
  setRetencionIva: (v: boolean) => void;
  milestones: Milestone[];
  setMilestoneField: (index: number, field: 'label' | 'dueDate' | 'amount', value: string | number) => void;
  handleMilestonePctChange: (index: number, pct: number) => void;
  handleAddMilestone: () => void;
  handleRemoveMilestone: (index: number) => void;
  isBalanceValid: () => boolean;
  getMilestoneSum: () => number;
  getMilestonePctSum: () => number;
  onBack: () => void;
  onNext: () => void;
}

const formatMoney = (amount: number, currency: string = 'MXN') => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export function FinancialSchemeStep({
  currency, setCurrency,
  totalAmount, setTotalAmount,
  retencionIsr, setRetencionIsr,
  retencionIva, setRetencionIva,
  milestones, setMilestoneField, handleMilestonePctChange, handleAddMilestone, handleRemoveMilestone,
  isBalanceValid, getMilestoneSum, getMilestonePctSum,
  onBack, onNext
}: FinancialSchemeStepProps) {
  return (
    <>
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
                name="totalAmount"
                required
                min={100}
                value={totalAmount === 0 ? "" : totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 pl-8 pr-4 py-2.5 text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Withholdings Toggles for Mexico (ISR/IVA) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 bg-slate-50/10 dark:bg-slate-900/5 flex flex-col gap-3 mt-1">
          <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider block">Retenciones Fiscales (Personas Morales)</span>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={retencionIsr}
                onChange={(e) => setRetencionIsr(e.target.checked)}
                className="rounded border-slate-350 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              Retener ISR (10%)
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={retencionIva}
                onChange={(e) => setRetencionIva(e.target.checked)}
                className="rounded border-slate-350 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              Retener IVA (10.667% / 2/3 partes)
            </label>
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
                  onChange={(e) => setMilestoneField(index, 'label', e.target.value)}
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
                    onChange={(e) => setMilestoneField(index, 'amount', Number(e.target.value))}
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
                  onChange={(e) => setMilestoneField(index, 'dueDate', e.target.value)}
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

      {/* Tax breakdown summary card */}
      <div className="glass p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/10 dark:bg-slate-900/5 flex flex-col gap-3">
        <span className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Desglose Fiscal Estimado (SAT México)</span>
        
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal (Honorarios brutos)</span>
            <span className="font-semibold">{formatMoney(totalAmount, currency)}</span>
          </div>
          <div className="flex justify-between text-slate-650 dark:text-slate-400">
            <span>+ IVA Trasladado (16%)</span>
            <span className="font-semibold">{formatMoney(totalAmount * 0.16, currency)}</span>
          </div>
          {retencionIsr && (
            <div className="flex justify-between text-red-650 dark:text-red-400">
              <span>- Retención ISR (10% Ley de ISR)</span>
              <span className="font-semibold">-{formatMoney(totalAmount * 0.10, currency)}</span>
            </div>
          )}
          {retencionIva && (
            <div className="flex justify-between text-red-650 dark:text-red-400">
              <span>- Retención IVA (2/3 de IVA - 10.667%)</span>
              <span className="font-semibold">-{formatMoney(totalAmount * 0.16 * (2 / 3), currency)}</span>
            </div>
          )}
          <div className="border-t border-slate-200 dark:border-slate-800 my-1.5" />
          <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white">
            <span>Total Neto Recibido (Estimado)</span>
            <span className="text-indigo-650 dark:text-indigo-400">{formatMoney(totalAmount + (totalAmount * 0.16) - (retencionIsr ? totalAmount * 0.10 : 0) - (retencionIva ? totalAmount * 0.16 * (2 / 3) : 0), currency)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isBalanceValid()}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Siguiente Paso
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
