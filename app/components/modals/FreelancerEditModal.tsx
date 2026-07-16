import React, { useState } from "react";
import { Contract, Milestone } from "@/lib/types";
import { saveContract, saveMilestones } from "@/lib/storageClient";
import { Plus, Trash2 } from "lucide-react";

interface FreelancerEditModalProps {
  contract: Contract;
  milestones: Milestone[];
  onClose: () => void;
  onRefresh: () => void;
}

export function FreelancerEditModal({ contract, milestones, onClose, onRefresh }: FreelancerEditModalProps) {
  const [clientName, setClientName] = useState(contract.clientName);
  const [clientEmail, setClientEmail] = useState(contract.clientEmail);
  const [clientPhone, setClientPhone] = useState(contract.clientPhone || '');
  const [clientRfc, setClientRfc] = useState(contract.clientRfc || '');
  const [scopeDescription, setScopeDescription] = useState(contract.scopeDescription);
  const [totalAmount, setTotalAmount] = useState(contract.totalAmount.toString());
  const [currency, setCurrency] = useState(contract.currency);
  const [retencionIsr, setRetencionIsr] = useState(!!contract.retencionIsr);
  
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>(milestones);
  const [activeTab, setActiveTab] = useState<'info' | 'milestones'>('info');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getMilestoneSum = () => {
    return localMilestones.reduce((acc, curr) => acc + (parseFloat(curr.amount.toString()) || 0), 0);
  };

  const isBalanceValid = () => {
    const parsedTotal = parseFloat(totalAmount) || 0;
    return Math.abs(getMilestoneSum() - parsedTotal) < 0.01;
  };

  const handleAddMilestone = () => {
    setLocalMilestones([
      ...localMilestones,
      {
        id: crypto.randomUUID(),
        contractId: contract.id,
        label: "",
        amount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]);
  };

  const handleRemoveMilestone = (id: string) => {
    setLocalMilestones(localMilestones.filter(m => m.id !== id));
  };

  const setMilestoneField = (id: string, field: keyof Milestone, value: string | number) => {
    setLocalMilestones(localMilestones.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanceValid()) {
      alert(`La suma de los hitos (${getMilestoneSum()}) debe ser igual al total (${totalAmount}).`);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const parsedTotal = parseFloat(totalAmount) || 0;
      const taxWithholdingAmount = (retencionIsr ? parsedTotal * 0.10 : 0) + (contract.retencionIva ? parsedTotal * 0.16 * (2 / 3) : 0);

      const updatedContract: Contract = {
        ...contract,
        clientName,
        clientEmail,
        clientPhone,
        clientRfc,
        scopeDescription,
        currency: currency as 'MXN' | 'USD',
        totalAmount: parsedTotal,
        retencionIsr,
        taxWithholdingAmount,
        status: 'sent', // Reset status
        acceptedAt: undefined,
        acceptedByName: undefined,
        acceptedIp: undefined,
        freelancerAcceptedAt: undefined,
        freelancerAcceptedByName: undefined,
        freelancerAcceptedIp: undefined,
        contractHash: undefined
      };

      await saveContract(updatedContract);
      
      // Update milestones
      await saveMilestones(localMilestones);
      
      onRefresh();
      onClose();
    } catch (e) {
      console.error(e);
      alert("Error saving modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-2">Confirmar</h3>
          <p className="text-slate-600 mb-6 text-sm">¿Estás seguro de que deseas guardar estas modificaciones? El contrato se restablecerá a estado &apos;Enviado&apos; y requerirá nueva firma.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
              Cancelar
            </button>
            <button onClick={handleConfirm} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        <h3 className="font-bold text-slate-900 mb-4 text-lg shrink-0">Modificar Propuesta</h3>
        
        <div className="flex gap-4 border-b border-slate-200 mb-6 shrink-0">
          <button 
            className={`pb-2 text-sm font-medium ${activeTab === 'info' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('info')}
          >
            Información General
          </button>
          <button 
            className={`pb-2 text-sm font-medium ${activeTab === 'milestones' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('milestones')}
          >
            Hitos de Pago
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto flex-1 pr-2">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nombre / Razón Social</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Email del Cliente</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Teléfono (Opcional)</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">RFC (Opcional)</label>
              <input
                type="text"
                value={clientRfc}
                onChange={(e) => setClientRfc(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-transparent uppercase"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Descripción / Alcance</label>
              <textarea
                required
                value={scopeDescription}
                onChange={(e) => setScopeDescription(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-transparent min-h-[80px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Monto Total</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-sm bg-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'MXN' | 'USD')}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-transparent"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={retencionIsr}
                onChange={(e) => setRetencionIsr(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-transparent"
              />
              Retención ISR (10%)
            </label>
          </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider">Monto Total a Cubrir</p>
                  <p className="text-2xl font-black text-indigo-900">${totalAmount} {currency}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider">Suma de Hitos</p>
                  <p className={`text-xl font-bold ${isBalanceValid() ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${getMilestoneSum()} {currency}
                  </p>
                </div>
              </div>

              {localMilestones.map((m) => (
                <div key={m.id} className="flex gap-3 items-start border border-slate-200 p-4 rounded-xl bg-slate-50 relative group">
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="text-3xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Concepto del Hito</label>
                      <input 
                        type="text" 
                        required
                        value={m.label} 
                        onChange={e => setMilestoneField(m.id, 'label', e.target.value)}
                        placeholder="Ej. Anticipo (50%)"
                        className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-3xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Monto</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            required
                            value={m.amount} 
                            onChange={e => setMilestoneField(m.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-3xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Fecha Límite</label>
                        <input 
                          type="date" 
                          value={m.dueDate.split('T')[0]} 
                          onChange={e => setMilestoneField(m.id, 'dueDate', e.target.value)}
                          className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                  {localMilestones.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveMilestone(m.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors mt-6"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button 
                type="button" 
                onClick={handleAddMilestone}
                className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Hito
              </button>
            </div>
          )}

          <div className="border-t border-slate-200 pt-5 mt-4 flex justify-end gap-3 sticky bottom-0 bg-white pb-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Confirmar y Solicitar Firma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
