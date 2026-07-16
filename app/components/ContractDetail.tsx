import React, { useState } from "react";
import { Contract, Milestone, AuditLog } from "@/lib/types";
import { SlideOver } from "./ui/SlideOver";
import { MilestoneTimeline } from "./MilestoneTimeline";
import { AuditTimeline } from "./AuditTimeline";
import { TaxBreakdown } from "./TaxBreakdown";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Copy, Edit2, ShieldCheck, AlertTriangle } from "lucide-react";
import { FreelancerEditModal } from "./modals/FreelancerEditModal";
import { vetAndAcceptContract, cancelContract } from "@/lib/storageClient";

interface ContractDetailProps {
  contract: Contract | null;
  milestones: Milestone[];
  logs: AuditLog[];
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: (id: string) => void;
  onRefresh?: () => void;
  onUpdateMilestone?: (id: string, status: string) => void;
  onOpenPaymentModal?: (milestone: Milestone) => void;
}

export function ContractDetail({ 
  contract, 
  milestones, 
  logs, 
  isOpen, 
  onClose,
  onCopyLink,
  onRefresh,
  onUpdateMilestone,
  onOpenPaymentModal
}: ContractDetailProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'milestones' | 'activity'>('info');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCounterSignConfirm, setShowCounterSignConfirm] = useState(false);
  const [isCounterSigning, setIsCounterSigning] = useState(false);

  // Cancellation state
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleCancelContract = async () => {
    try {
      setIsCanceling(true);
      await cancelContract(contract!.id, 'freelancer', cancelReason);
      setShowCancelConfirm(false);
      setShowCancelReason(false);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      alert("Error: " + error.message);
    } finally {
      setIsCanceling(false);
    }
  };

  if (!contract) return null;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft': return <Badge variant="default">Borrador</Badge>;
      case 'sent': return <Badge variant="info">Enviado</Badge>;
      case 'client_signed': return <Badge variant="warning">Firmado por Cliente</Badge>;
      case 'accepted': return <Badge variant="success">Sellado</Badge>;
      case 'completed': return <Badge variant="success">Completado</Badge>;
      case 'cancelled': return <Badge variant="error">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Detalle de Contrato">
      <div className="flex flex-col h-full -mx-4 -mt-6">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{contract.clientName}</h2>
              <p className="text-sm text-slate-500 mt-1">{contract.scopeDescription}</p>
            </div>
            {getStatusBadge(contract.status)}
          </div>

          <div className="flex gap-4 border-b border-slate-200">
            <button 
              className={`pb-2 text-sm font-medium ${activeTab === 'info' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('info')}
            >
              Información
            </button>
            <button 
              className={`pb-2 text-sm font-medium ${activeTab === 'milestones' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('milestones')}
            >
              Hitos
            </button>
            <button 
              className={`pb-2 text-sm font-medium ${activeTab === 'activity' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('activity')}
            >
              Actividad
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <TaxBreakdown 
                subtotal={contract.subtotalAmount || contract.totalAmount}
                iva={contract.ivaAmount || 0}
                retencionIsr={contract.taxWithholdingAmount || 0} // Using as fallback for visual representation
                retencionIva={0}
                total={contract.totalAmount}
                currency={contract.currency}
              />

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Detalles del Cliente</h3>
                <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
                  <p><span className="text-slate-500">Email:</span> {contract.clientEmail}</p>
                  {contract.clientPhone && <p><span className="text-slate-500">Teléfono:</span> {contract.clientPhone}</p>}
                  {contract.clientRfc && <p><span className="text-slate-500">RFC:</span> {contract.clientRfc}</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <MilestoneTimeline 
              milestones={milestones} 
              currency={contract.currency}
              onUpdateMilestone={onUpdateMilestone}
              onOpenPaymentModal={onOpenPaymentModal}
            />
          )}

          {activeTab === 'activity' && (
            <AuditTimeline logs={logs} />
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => onCopyLink(contract.id)}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link
          </Button>
          {(contract.status === 'sent' || contract.status === 'draft') && (
            <Button variant="secondary" className="flex-1" onClick={() => setIsEditModalOpen(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Modificar Propuesta
            </Button>
          )}
          {contract.status === 'client_signed' && (
            <Button variant="primary" className="flex-1 bg-purple-600 hover:bg-purple-500" onClick={() => setShowCounterSignConfirm(true)}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              Validar y Contra-firmar
            </Button>
          )}
          <Button className="flex-1" variant="danger" onClick={() => setShowCancelReason(true)}>
            Cancelar Contrato
          </Button>
        </div>
      </div>
      {isEditModalOpen && (
        <FreelancerEditModal
          contract={contract}
          milestones={milestones}
          onClose={() => setIsEditModalOpen(false)}
          onRefresh={onRefresh || (() => {})}
        />
      )}
      
      {showCounterSignConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Contra-firmar y Sellar Contrato</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
              Al confirmar, validas que el cliente ha firmado y que aceptas iniciar el proyecto. El contrato cambiará a estado &apos;Activo&apos;.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCounterSignConfirm(false)} 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                disabled={isCounterSigning}
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  setIsCounterSigning(true);
                  try {
                    await vetAndAcceptContract(contract.id, "Héctor J. Guerrero"); // Freelancer name hardcoded or from profile
                    setShowCounterSignConfirm(false);
                    onRefresh?.();
                  } catch (err) {
                    console.error("Failed to counter sign:", err);
                    alert("Error al contra-firmar");
                  } finally {
                    setIsCounterSigning(false);
                  }
                }} 
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2"
                disabled={isCounterSigning}
              >
                {isCounterSigning ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Motivo de Cancelación</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ej. Incumplimiento de pagos..."
              className="w-full h-32 p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-900 dark:text-white"
            />
            <div className="flex gap-3 justify-end mt-4">
              <Button variant="secondary" onClick={() => setShowCancelReason(false)}>Atrás</Button>
              <Button onClick={() => setShowCancelConfirm(true)}>Confirmar Cancelación</Button>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cancelar Contrato</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                ¿Estás seguro de que deseas cancelar este contrato? Esta acción es irreversible.
              </p>
              <div className="flex gap-3 w-full">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCancelConfirm(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="danger" 
                  className="flex-1" 
                  onClick={handleCancelContract}
                  isLoading={isCanceling}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SlideOver>
  );
}
