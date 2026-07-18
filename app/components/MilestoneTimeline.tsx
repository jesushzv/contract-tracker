import React from "react";
import { Milestone } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { CheckCircle2, Clock, RotateCcw } from "lucide-react";

interface MilestoneTimelineProps {
  milestones: Milestone[];
  currency: string;
  onUpdateMilestone?: (id: string, status: string) => void;
  onOpenPaymentModal?: (milestone: Milestone) => void;
  onGenerateInvoice?: (milestone: Milestone) => void;
  isClientView?: boolean;
}

export function MilestoneTimeline({ milestones, currency, onUpdateMilestone, onOpenPaymentModal, onGenerateInvoice, isClientView }: MilestoneTimelineProps) {
  const [revertingMilestoneId, setRevertingMilestoneId] = React.useState<string | null>(null);

  const getMilestoneIcon = (status: string) => {
    if (status === 'confirmed') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (status === 'marked_paid') return <Clock className="w-5 h-5 text-amber-500" />;
    return <div className="w-3 h-3 rounded-full bg-slate-300 mt-1" />;
  };

  const getMilestoneStatus = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge variant="success">Cobro Listo</Badge>;
      case 'marked_paid': return <Badge variant="warning">Reportado</Badge>;
      case 'requested': return <Badge variant="info">Solicitado</Badge>;
      default: return <Badge variant="default">Pendiente</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {milestones.map((m, i) => (
        <div key={m.id} className="relative flex gap-4">
          {i !== milestones.length - 1 && (
            <div className="absolute left-2.5 top-6 bottom-[-16px] w-px bg-slate-200" />
          )}
          <div className="relative z-10 flex flex-col items-center pt-0.5">
            {getMilestoneIcon(m.status)}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-slate-900">{m.label || `Hito ${i + 1}`}</h4>
                <p className="text-sm text-slate-500">Vence: {m.dueDate}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-sm font-medium text-slate-900">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(m.amount)}
                </p>
                <div className="mt-1 flex flex-col gap-1 items-end">
                  {getMilestoneStatus(m.status)}
                  {m.cfdiStatus && m.cfdiStatus !== 'none' && (
                    <Badge variant={m.cfdiStatus === 'issued' ? 'success' : 'warning'}>
                      {m.cfdiStatus === 'issued' ? 'Factura Emitida' : (m.cfdiStatus === 'pending_csd' ? 'Falta CSD' : 'Factura Pendiente')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-3 flex gap-2">
              {m.status === 'pending' && onUpdateMilestone && (
                <button
                  onClick={() => onUpdateMilestone(m.id, 'requested')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                >
                  Solicitar Cobro
                </button>
              )}
              {m.status === 'requested' && onOpenPaymentModal && (
                <button
                  onClick={() => onOpenPaymentModal(m)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                >
                  Marcar como Pagado
                </button>
              )}
              {m.status === 'marked_paid' && onUpdateMilestone && (
                <button
                  onClick={() => onUpdateMilestone(m.id, 'confirmed')}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors shadow-md shadow-indigo-500/10"
                >
                  Confirmar Recepción
                </button>
              )}
              {m.status === 'confirmed' && onUpdateMilestone && (
                <button
                  onClick={() => setRevertingMilestoneId(m.id)}
                  title="Revertir a Reportado"
                  className="bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              {m.status === 'confirmed' && !isClientView && (m.cfdiStatus === 'pending_invoice' || m.cfdiStatus === 'pending_csd') && onGenerateInvoice && (
                <button
                  onClick={() => onGenerateInvoice(m)}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
                >
                  Emitir CFDI
                </button>
              )}
              {m.cfdiStatus === 'issued' && (
                <div className="flex gap-2 items-center ml-2 border-l border-slate-200 pl-2">
                  {m.cfdiPdfUrl && (
                    <a href={m.cfdiPdfUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs font-semibold px-2 py-1">PDF</a>
                  )}
                  {m.cfdiXmlUrl && (
                    <a href={m.cfdiXmlUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs font-semibold px-2 py-1">XML</a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {revertingMilestoneId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Revertir Estado de Hito</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              ¿Estás seguro de que deseas revertir este hito al estado &quot;Reportado&quot;?
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                onClick={() => setRevertingMilestoneId(null)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg"
                onClick={() => {
                  if (onUpdateMilestone) onUpdateMilestone(revertingMilestoneId, 'marked_paid');
                  setRevertingMilestoneId(null);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
