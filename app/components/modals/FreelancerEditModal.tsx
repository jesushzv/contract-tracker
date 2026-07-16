import React, { useState } from "react";
import { Contract, Milestone } from "@/lib/types";
import { saveContract, addAuditLog } from "@/lib/storageClient";

interface FreelancerEditModalProps {
  contract: Contract;
  milestones: Milestone[];
  onClose: () => void;
  onRefresh: () => void;
}

export function FreelancerEditModal({ contract, onClose, onRefresh }: FreelancerEditModalProps) {
  const [clientName, setClientName] = useState(contract.clientName);
  const [retencionIsr, setRetencionIsr] = useState(!!contract.retencionIsr);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const total = contract.totalAmount;
      const taxWithholdingAmount = (retencionIsr ? total * 0.10 : 0) + (contract.retencionIva ? total * 0.16 * (2 / 3) : 0);

      const updatedContract: Contract = {
        ...contract,
        clientName,
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">Confirmar</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">¿Estás seguro de que deseas guardar estas modificaciones? El contrato se restablecerá a estado &apos;Enviado&apos;.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white mb-6 text-lg">Modificar Propuesta</h3>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Nombre / Razón Social</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm bg-transparent dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={retencionIsr}
                onChange={(e) => setRetencionIsr(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-transparent"
              />
              Retención ISR
            </label>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
