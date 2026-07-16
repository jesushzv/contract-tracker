import React, { useState, useRef, useEffect } from "react";
import { Contract } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { MoreHorizontal, Eye, Copy } from "lucide-react";

interface ContractCardProps {
  contract: Contract;
  onClick: () => void;
}

export function ContractCard({ contract, onClick }: ContractCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="relative" ref={menuRef}>
          <button 
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-50 py-1" onClick={(e) => e.stopPropagation()}>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onClick(); }}
              >
                <Eye className="w-4 h-4" /> Ver Detalles
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsMenuOpen(false); 
                  const token = contract.clientAccessToken || `token-${contract.id}`;
                  navigator.clipboard.writeText(`${window.location.origin}/c/${contract.id}?demo=true&token=${token}`);
                }}
              >
                <Copy className="w-4 h-4" /> Copiar Link
              </button>
            </div>
          )}
        </div>
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
