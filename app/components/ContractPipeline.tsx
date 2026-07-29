import React from "react";
import { Contract } from "@/lib/types";
import { ContractCard } from "./ContractCard";
import { EmptyState } from "./ui/EmptyState";
import { FileText } from "lucide-react";

interface ContractPipelineProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onCreateNew?: () => void;
}

const COLUMNS = [
  { id: 'draft', title: 'Borrador' },
  { id: 'sent', title: 'Enviado' },
  { id: 'client_signed', title: 'Firmado' },
  { id: 'accepted', title: 'Sellado' },
  { id: 'completed', title: 'Completado' },
];

export function ContractPipeline({ contracts, onSelectContract, onCreateNew }: ContractPipelineProps) {
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

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 pt-2 snap-x hide-scrollbar">
      {COLUMNS.map(col => {
        const colContracts = contracts.filter(c => c.status === col.id);
        return (
          <div key={col.id} className="flex flex-col min-w-[320px] max-w-[320px] snap-center">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-semibold text-slate-800">{col.title}</h3>
              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {colContracts.length}
              </span>
            </div>
            
            <div className="flex flex-col gap-3 min-h-[200px] bg-slate-50/50 rounded-xl p-2 border border-dashed border-slate-200">
              {colContracts.length > 0 ? (
                colContracts.map(contract => (
                  <ContractCard 
                    key={contract.id} 
                    contract={contract} 
                    onClick={() => onSelectContract(contract)} 
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-24">
                  <p className="text-sm text-slate-400 text-center">No hay contratos aquí</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
