import { useState, useMemo } from 'react';
import { Contract, ContractVersion, AuditLog } from '@/lib/types';
import { getContracts, getContractVersions, getAuditLogs } from '@/lib/storageClient';

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedContractLogs, setSelectedContractLogs] = useState<AuditLog[]>([]);
  const [contractVersions, setContractVersions] = useState<ContractVersion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'client_signed' | 'accepted' | 'completed' | 'overdue'>('all');

  // Filtering logic
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesSearch = c.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      
      switch (activeTab) {
        case 'draft': return c.status === 'draft';
        case 'sent': return c.status === 'sent';
        case 'client_signed': return c.status === 'client_signed';
        case 'accepted': return c.status === 'accepted';
        case 'completed': return c.status === 'completed';
        default: return true;
      }
    });
  }, [contracts, searchTerm, activeTab]);

  return {
    contracts,
    setContracts,
    selectedContract,
    setSelectedContract,
    selectedContractLogs,
    setSelectedContractLogs,
    contractVersions,
    setContractVersions,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    filteredContracts
  };
}
