"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ContractPipeline } from "../components/ContractPipeline";
import { ContractListView } from "../components/ContractListView";
import { MoneyCard } from "../components/MoneyCard";
import { ContractDetail } from "../components/ContractDetail";
import { Button } from "../components/ui/Button";
import { Contract } from "@/lib/types";

import { useContracts } from "../hooks/useContracts";
import { useMilestones } from "../hooks/useMilestones";
import { useProfile } from "../hooks/useProfile";
import { useFinancialStats } from "../hooks/useFinancialStats";

import { getContracts, getMilestones, getAuditLogs } from "@/lib/storageClient";
import { LayoutList, LayoutGrid, Plus } from "lucide-react";

export default function Dashboard() {
  const { profile } = useProfile();
  const { contracts, setContracts, selectedContract, setSelectedContract, selectedContractLogs, setSelectedContractLogs } = useContracts();
  const { milestones, setMilestones, allMilestones, setAllMilestones } = useMilestones();
  const { financialStats } = useFinancialStats(contracts, allMilestones);

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getContracts();
      setContracts(data);
      const mData = await getMilestones();
      setAllMilestones(mData);
    }
    load();
  }, [setContracts, setAllMilestones]);

  const handleSelectContract = async (contract: Contract) => {
    setSelectedContract(contract);
    const mData = await getMilestones(contract.id);
    setMilestones(mData);
    const logs = await getAuditLogs(contract.id);
    setSelectedContractLogs(logs);
    setIsDetailOpen(true);
  };

  const handleRefresh = async () => {
    const data = await getContracts();
    setContracts(data);
    const mData = await getMilestones();
    setAllMilestones(mData);
    if (selectedContract) {
      const updatedSelected = data.find(c => c.id === selectedContract.id);
      if (updatedSelected) {
        setSelectedContract(updatedSelected);
        const logs = await getAuditLogs(updatedSelected.id);
        setSelectedContractLogs(logs);
      }
    }
  };

  return (
    <AppShell activePath="/dashboard">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hola, {profile?.fullName?.split(' ')[0] || 'Usuario'}</h1>
            <p className="text-slate-500">Aquí está el resumen de tu negocio.</p>
          </div>
          <Button onClick={() => {}}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contrato
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MoneyCard title="Cobrado (MXN)" amount={financialStats.cobradoMXN} currency="MXN" type="success" />
          <MoneyCard title="Por Confirmar (MXN)" amount={financialStats.porConfirmarMXN} currency="MXN" type="warning" />
          <MoneyCard title="Pendiente (MXN)" amount={financialStats.pendienteMXN} currency="MXN" type="neutral" />
        </div>

        <div className="flex justify-between items-center mt-4">
          <h2 className="text-lg font-semibold text-slate-800">Tus Contratos</h2>
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button 
              className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              onClick={() => setViewMode('board')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === 'board' ? (
          <ContractPipeline contracts={contracts} onSelectContract={handleSelectContract} />
        ) : (
          <ContractListView contracts={contracts} onSelectContract={handleSelectContract} />
        )}
      </div>

      <ContractDetail 
        contract={selectedContract} 
        milestones={milestones} 
        logs={selectedContractLogs} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        onCopyLink={(id) => {
          const token = selectedContract?.clientAccessToken || `token-${id}`;
          const url = `${window.location.origin}/c/${id}?demo=true&token=${token}`;
          navigator.clipboard.writeText(url);
          alert("Link copiado: " + url);
        }}
        onRefresh={handleRefresh}
      />
      
      {/* Modals for actions could be rendered here triggered by ContractDetail onActionClick */}
    </AppShell>
  );
}
