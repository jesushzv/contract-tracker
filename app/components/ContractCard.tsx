import React from "react";
import { Contract } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { MoreHorizontal } from "lucide-react";

interface ContractCardProps {
  contract: Contract;
  onClick: () => void;
}

export function ContractCard({ contract, onClick }: ContractCardProps) {
  // Determine state-appropriate CTA or style
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
    <Card 
      className="p-4 flex flex-col gap-3 min-w-[280px] hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-slate-900 line-clamp-1">{contract.clientName}</h3>
          <p className="text-sm text-slate-500 line-clamp-1">{contract.scopeDescription}</p>
        </div>
        <button 
          className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          onClick={(e) => { e.stopPropagation(); /* TODO: Open overflow menu */ }}
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-lg font-semibold text-slate-900">
          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: contract.currency }).format(contract.totalAmount)}
        </span>
        {getStatusBadge(contract.status)}
      </div>
    </Card>
  );
}
