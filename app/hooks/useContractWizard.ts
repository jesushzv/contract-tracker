import { useState, useCallback, useEffect } from "react";
import { CONTRACT_TEMPLATES } from "@/lib/mockData";
import { validateRFC } from "@/lib/rfcValidator";
import { Profile, PaymentProfile } from "@/lib/types";

export type TemplateType = 'general' | 'design' | 'development' | 'consulting';

export function useContractWizard(
  initialProfile: Profile | null,
  initialPaymentProfiles: PaymentProfile[],
  initialTemplate: string | null
) {
  const [step, setStep] = useState(1);

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientRfc, setClientRfc] = useState("");
  const [clientRegimen, setClientRegimen] = useState("");
  const [clientPostal, setClientPostal] = useState("");
  const [clientCfdiUse, setClientCfdiUse] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [satProductCode, setSatProductCode] = useState("81111509");
  const [taxRegimeType, setTaxRegimeType] = useState("general");
  
  const [scopeDescription, setScopeDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState<number>(30000);
  const [currency, setCurrency] = useState<'MXN' | 'USD'>("MXN");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("general");
  const [retencionIsr, setRetencionIsr] = useState(false);
  const [retencionIva, setRetencionIva] = useState(false);
  const [clientRfcError, setClientRfcError] = useState("");

  // Dynamic Milestones
  const [milestones, setMilestones] = useState([
    { label: "Anticipo inicial (50%)", pct: 50, amount: 15000, dueDate: "" },
    { label: "Entrega y finiquito (50%)", pct: 50, amount: 15000, dueDate: "" }
  ]);

  // Selected Legal Clauses
  const [selectedClauses, setSelectedClauses] = useState<string[]>(CONTRACT_TEMPLATES.general.defaultClauses);

  // SPEI details
  const [clabe, setClabe] = useState("");
  const [bankName, setBankName] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");

  // Fiscal details
  const [freelancerRfc, setFreelancerRfc] = useState("");
  const [freelancerRegimen, setFreelancerRegimen] = useState("");
  const [freelancerPostal, setFreelancerPostal] = useState("");

  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (initialProfile) {
      setBeneficiaryName(initialProfile.bankDetails.beneficiaryName || "");
      setFreelancerRfc(initialProfile.rfc || "");
      setFreelancerRegimen(initialProfile.regimenFiscal || "");
      setFreelancerPostal(initialProfile.codigoPostal || "");
      
      const defaultProfile = initialPaymentProfiles.find(p => p.isDefault);
      if (defaultProfile) {
        setSelectedProfileId(defaultProfile.id);
        setClabe(defaultProfile.clabe);
        setBankName(defaultProfile.bankName);
      } else {
        setClabe(initialProfile.bankDetails.clabe);
        setBankName(initialProfile.bankDetails.bankName);
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialProfile, initialPaymentProfiles]);

  const handleClientRfcBlur = useCallback(() => {
    if (!clientRfc) {
      setClientRfcError("");
      return;
    }
    const check = validateRFC(clientRfc);
    if (!check.isValid) {
      setClientRfcError(check.error || "RFC inválido");
    } else {
      setClientRfcError("");
    }
  }, [clientRfc]);

  const handleTemplateChange = useCallback((tmplKey: TemplateType) => {
    setSelectedTemplate(tmplKey);
    setSelectedClauses(CONTRACT_TEMPLATES[tmplKey].defaultClauses);

    let newMilestones: Array<{ label: string; pct: number; amount: number; dueDate: string }> = [];
    if (tmplKey === 'general') {
      newMilestones = [
        { label: "Anticipo inicial (50%)", pct: 50, amount: Math.round(totalAmount * 0.5), dueDate: "" },
        { label: "Entrega y finiquito (50%)", pct: 50, amount: Math.round(totalAmount * 0.5), dueDate: "" }
      ];
    } else if (tmplKey === 'design') {
      newMilestones = [
        { label: "Anticipo contra firma (40%)", pct: 40, amount: Math.round(totalAmount * 0.4), dueDate: "" },
        { label: "Entrega de propuestas conceptuales (30%)", pct: 30, amount: Math.round(totalAmount * 0.3), dueDate: "" },
        { label: "Entrega final y finiquito (30%)", pct: 30, amount: Math.round(totalAmount * 0.3), dueDate: "" }
      ];
    } else if (tmplKey === 'development') {
      newMilestones = [
        { label: "Anticipo contra inicio (30%)", pct: 30, amount: Math.round(totalAmount * 0.3), dueDate: "" },
        { label: "Entrega de versión Beta funcional (40%)", pct: 40, amount: Math.round(totalAmount * 0.4), dueDate: "" },
        { label: "Despliegue a producción y finiquito (30%)", pct: 30, amount: Math.round(totalAmount * 0.3), dueDate: "" }
      ];
    } else if (tmplKey === 'consulting') {
      newMilestones = [
        { label: "Pago único de honorarios (100%)", pct: 100, amount: totalAmount, dueDate: "" }
      ];
    }
    setMilestones(newMilestones);
  }, [totalAmount]);

  useEffect(() => {
    if (initialTemplate && ["general", "design", "development", "consulting"].includes(initialTemplate)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleTemplateChange(initialTemplate as TemplateType);
    }
  }, [initialTemplate, handleTemplateChange]);

  const handleTotalAmountChange = useCallback((amount: number) => {
    setTotalAmount(amount);
    setMilestones(prev => 
      prev.map(m => ({
        ...m,
        amount: Math.round((m.pct / 100) * amount)
      }))
    );
  }, []);

  const handleMilestonePctChange = useCallback((index: number, pct: number) => {
    setMilestones(prev => {
      const updated = [...prev];
      updated[index].pct = pct;
      updated[index].amount = Math.round((pct / 100) * totalAmount);
      return updated;
    });
  }, [totalAmount]);

  const handleAddMilestone = useCallback(() => {
    const defaultPct = 20;
    const defaultAmount = Math.round((defaultPct / 100) * totalAmount);
    setMilestones(prev => [
      ...prev,
      { label: `Hito de pago #${prev.length + 1}`, pct: defaultPct, amount: defaultAmount, dueDate: "" }
    ]);
  }, [totalAmount]);

  const handleRemoveMilestone = useCallback((index: number) => {
    setMilestones(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  }, []);

  const handleToggleClause = useCallback((clauseId: string) => {
    setSelectedClauses(prev => 
      prev.includes(clauseId) 
        ? prev.filter(id => id !== clauseId) 
        : [...prev, clauseId]
    );
  }, []);

  const getMilestoneSum = useCallback(() => {
    return milestones.reduce((sum, m) => sum + m.amount, 0);
  }, [milestones]);

  const getMilestonePctSum = useCallback(() => {
    return milestones.reduce((sum, m) => sum + m.pct, 0);
  }, [milestones]);

  const isBalanceValid = useCallback(() => {
    return getMilestoneSum() === totalAmount;
  }, [getMilestoneSum, totalAmount]);

  const setMilestoneField = useCallback((index: number, field: 'label' | 'dueDate' | 'amount', value: string | number) => {
    setMilestones(prev => {
      const updated = [...prev];
      if (field === 'amount') {
         updated[index].amount = value as number;
         updated[index].pct = totalAmount > 0 ? Math.round(((value as number) / totalAmount) * 1000) / 10 : 0;
      } else {
         updated[index] = { ...updated[index], [field]: value as string };
      }
      return updated;
    });
  }, [totalAmount]);

  return {
    step, setStep,
    clientName, setClientName,
    clientEmail, setClientEmail,
    clientRfc, setClientRfc,
    clientRegimen, setClientRegimen,
    clientPostal, setClientPostal,
    clientCfdiUse, setClientCfdiUse,
    clientPhone, setClientPhone,
    satProductCode, setSatProductCode,
    taxRegimeType, setTaxRegimeType,
    scopeDescription, setScopeDescription,
    totalAmount, setTotalAmount: handleTotalAmountChange,
    currency, setCurrency,
    selectedTemplate, setSelectedTemplate: handleTemplateChange,
    retencionIsr, setRetencionIsr,
    retencionIva, setRetencionIva,
    clientRfcError, setClientRfcError,
    milestones, setMilestoneField, handleMilestonePctChange, handleAddMilestone, handleRemoveMilestone,
    selectedClauses, handleToggleClause,
    clabe, setClabe,
    bankName, setBankName,
    beneficiaryName, setBeneficiaryName,
    freelancerRfc, setFreelancerRfc,
    freelancerRegimen, setFreelancerRegimen,
    freelancerPostal, setFreelancerPostal,
    selectedProfileId, setSelectedProfileId,
    handleClientRfcBlur,
    getMilestoneSum,
    getMilestonePctSum,
    isBalanceValid,
  };
}
