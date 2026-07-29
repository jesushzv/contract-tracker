import { useMemo } from 'react';
import { Contract, Milestone } from '@/lib/types';

export function useFinancialStats(contracts: Contract[], allMilestones: Milestone[]) {
  // Mocked financial stats computation based on what the dashboard monolith was doing
  const financialStats = useMemo(() => {
    let cobradoMXN = 0;
    let porConfirmarMXN = 0;
    let pendienteMXN = 0;
    let cobradoUSD = 0;
    let porConfirmarUSD = 0;
    let pendienteUSD = 0;

    allMilestones.forEach(m => {
      const parentContract = contracts.find(c => c.id === m.contractId);
      if (!parentContract) return;

      const amt = m.amount;
      const isMXN = parentContract.currency === 'MXN';

      if (m.status === 'confirmed') {
        if (isMXN) cobradoMXN += amt;
        else cobradoUSD += amt;
      } else if (m.status === 'marked_paid') {
        if (isMXN) porConfirmarMXN += amt;
        else porConfirmarUSD += amt;
      } else {
        // Pending
        if (isMXN) pendienteMXN += amt;
        else pendienteUSD += amt;
      }
    });

    return {
      cobradoMXN,
      porConfirmarMXN,
      pendienteMXN,
      cobradoUSD,
      porConfirmarUSD,
      pendienteUSD
    };
  }, [contracts, allMilestones]);

  return { financialStats };
}
