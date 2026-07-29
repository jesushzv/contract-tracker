"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../components/AppShell";
import { ContractPipeline } from "../components/ContractPipeline";
import { ContractListView } from "../components/ContractListView";
import { MoneyCard } from "../components/MoneyCard";
import { ContractDetail } from "../components/ContractDetail";
import { Button } from "../components/ui/Button";
import { Contract, Milestone } from "@/lib/types";

import { useContracts } from "../hooks/useContracts";
import { useMilestones } from "../hooks/useMilestones";
import { useProfile } from "../hooks/useProfile";
import { useFinancialStats } from "../hooks/useFinancialStats";

import { getContracts, getMilestones, getAuditLogs, updateMilestoneStatus, markMilestoneAsTransferred, isDemoMode } from "@/lib/storageClient";
import { LayoutList, LayoutGrid, Plus } from "lucide-react";
import { ClientPaymentUpload } from "../components/client/ClientPaymentUpload";

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useProfile();
  const { contracts, setContracts, selectedContract, setSelectedContract, selectedContractLogs, setSelectedContractLogs } = useContracts();
  const { milestones, setMilestones, allMilestones, setAllMilestones } = useMilestones();
  const { financialStats } = useFinancialStats(contracts, allMilestones);

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMilestone, setPaymentMilestone] = useState<Milestone | null>(null);
  const [trackingReference, setTrackingReference] = useState("");
  const [transferredAmount, setTransferredAmount] = useState<number>(0);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptFileType, setReceiptFileType] = useState<'file' | 'url'>('file');
  const [receiptFileBase64, setReceiptFileBase64] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [overrideExchangeRate, setOverrideExchangeRate] = useState("20.15");
  const [modalError, setModalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        const mList = mData.filter(m => m.contractId === updatedSelected.id);
        setMilestones(mList);
        const logs = await getAuditLogs(updatedSelected.id);
        setSelectedContractLogs(logs);
      }
    }
  };

  const handleUpdateMilestone = async (milestoneId: string, newStatus: string) => {
    try {
      await updateMilestoneStatus(milestoneId, newStatus as Milestone['status']);
      await handleRefresh();
    } catch (err: unknown) {
      console.error("Error updating milestone:", err);
      alert("Error al actualizar hito");
    }
  };

  const handleOpenPaymentModal = (milestone: Milestone) => {
    setPaymentMilestone(milestone);
    setTrackingReference("");
    setTransferredAmount(milestone.amount);
    setReceiptUrl("");
    setReceiptFileType("file");
    setReceiptFileBase64("");
    setReceiptFileName("");
    setModalError(null);
    setOverrideExchangeRate("20.15");
    setShowPaymentModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptFileBase64("");
      setReceiptFileName("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setModalError("El archivo excede el límite de tamaño de 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setReceiptFileBase64(base64String);
      setReceiptFileName(file.name);
      setModalError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleMarkAsTransferred = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMilestone) return;

    if (receiptFileType === 'url' && receiptUrl && !receiptUrl.startsWith('http')) {
      setModalError("Debes proporcionar un enlace URL válido.");
      return;
    }

    setLoading(true);
    setModalError(null);

    try {
      let finalReceiptUrl = undefined;
      if (receiptFileType === 'url') {
        finalReceiptUrl = receiptUrl || undefined;
      } else if (receiptFileBase64 && receiptFileName) {
        finalReceiptUrl = `local-upload-${receiptFileName}`;
      }
      await markMilestoneAsTransferred(
        paymentMilestone.id, 
        trackingReference, 
        transferredAmount, 
        finalReceiptUrl
      );
      setShowPaymentModal(false);
      await handleRefresh();
    } catch (err: unknown) {
      setModalError((err as Error).message || "Error al registrar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activePath="/dashboard">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hola, {profile?.fullName?.split(' ')[0] || 'Usuario'}</h1>
            <p className="text-slate-500">Aquí está el resumen de tu negocio.</p>
          </div>
          <Button onClick={() => router.push("/contracts/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contrato
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MoneyCard title="Cobrado (MXN)" amount={financialStats.cobradoMXN} currency="MXN" type="success" />
          <MoneyCard title="Por Confirmar (MXN)" amount={financialStats.porConfirmarMXN} currency="MXN" type="warning" />
          <MoneyCard title="Pendiente (MXN)" amount={financialStats.pendienteMXN} currency="MXN" type="neutral" />
        </div>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center items-start gap-3 mt-4">
          <h2 className="text-lg font-semibold text-slate-800">Tus Contratos</h2>
          <div className="flex bg-slate-100 p-1 rounded-md self-end sm:self-auto">
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
          const demoParam = isDemoMode() ? "&demo=true" : "";
          const url = `${window.location.origin}/c/${id}?token=${token}${demoParam}`;
          navigator.clipboard.writeText(url);
          alert("Link copiado: " + url);
        }}
        onRefresh={handleRefresh}
        onUpdateMilestone={handleUpdateMilestone}
        onOpenPaymentModal={handleOpenPaymentModal}
      />
      
      <ClientPaymentUpload 
        isFreelancer={true}
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
        paymentMilestone={paymentMilestone}
        setPaymentMilestone={setPaymentMilestone}
        contract={selectedContract}
        handleMarkAsTransferred={handleMarkAsTransferred}
        trackingReference={trackingReference}
        setTrackingReference={setTrackingReference}
        transferredAmount={transferredAmount}
        setTransferredAmount={setTransferredAmount}
        overrideExchangeRate={overrideExchangeRate}
        setOverrideExchangeRate={setOverrideExchangeRate}
        receiptFileType={receiptFileType}
        setReceiptFileType={setReceiptFileType}
        receiptUrl={receiptUrl}
        setReceiptUrl={setReceiptUrl}
        receiptFileName={receiptFileName}
        handleFileChange={handleFileChange}
        modalError={modalError}
        loading={loading}
      />
    </AppShell>
  );
}
