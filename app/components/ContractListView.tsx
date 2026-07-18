import React, { useState, useRef, useEffect } from "react";
import { Contract } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { EmptyState } from "./ui/EmptyState";
import { FileText, MoreHorizontal, Eye, Copy } from "lucide-react";
import { isDemoMode } from "@/lib/storageClient";

interface ContractListViewProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onCreateNew?: () => void;
}

export function ContractListView({ contracts, onSelectContract, onCreateNew }: ContractListViewProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (contracts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No tienes contratos"
        description="Crea tu primer contrato para empezar a organizar tu pipeline."
        actionLabel="Crear Contrato"
        onAction={onCreateNew}
      />
    );
  }

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
    <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Proyecto</th>
              <th className="px-6 py-3 text-right">Monto</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contracts.map(contract => (
              <tr 
                key={contract.id} 
                onClick={() => onSelectContract(contract)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 font-medium text-slate-900">{contract.clientName}</td>
                <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{contract.scopeDescription}</td>
                <td className="px-6 py-4 text-right font-medium text-slate-900">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: contract.currency }).format(contract.totalAmount)}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(contract.status)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="relative inline-block text-left" ref={openMenuId === contract.id ? menuRef : null}>
                    <button 
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setOpenMenuId(openMenuId === contract.id ? null : contract.id);
                      }}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {openMenuId === contract.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-50 py-1" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onSelectContract(contract); }}
                        >
                          <Eye className="w-4 h-4" /> Ver Detalles
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenMenuId(null); 
                            const token = contract.clientAccessToken || `token-${contract.id}`;
                            const demoParam = isDemoMode() ? "&demo=true" : "";
                            navigator.clipboard.writeText(`${window.location.origin}/c/${contract.id}?token=${token}${demoParam}`);
                          }}
                        >
                          <Copy className="w-4 h-4" /> Copiar Link
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
