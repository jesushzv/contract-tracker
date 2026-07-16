import React, { useState } from "react";
import { Contract, Milestone, AuditLog } from "@/lib/types";
import { SlideOver } from "./ui/SlideOver";
import { MilestoneTimeline } from "./MilestoneTimeline";
import { AuditTimeline } from "./AuditTimeline";
import { TaxBreakdown } from "./TaxBreakdown";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Copy } from "lucide-react";

interface ContractDetailProps {
  contract: Contract | null;
  milestones: Milestone[];
  logs: AuditLog[];
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: (id: string) => void;
  onActionClick?: (action: string) => void;
}

export function ContractDetail({ 
  contract, 
  milestones, 
  logs, 
  isOpen, 
  onClose,
  onCopyLink,
  onActionClick
}: ContractDetailProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'milestones' | 'activity'>('info');

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
            <MilestoneTimeline milestones={milestones} currency={contract.currency} />
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
          <Button className="flex-1" onClick={() => onActionClick?.('primary')}>
            Acciones
          </Button>
        </div>
      </div>
    </SlideOver>
  );
}
