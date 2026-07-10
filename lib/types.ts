export interface Profile {
  id: string;
  email: string;
  fullName: string;
  rfc?: string;
  regimenFiscal?: string;
  codigoPostal?: string;
  bankDetails: {
    clabe: string;
    bankName: string;
    beneficiaryName: string;
  };
}

export type ContractStatus = 'draft' | 'sent' | 'accepted' | 'completed' | 'cancelled';

export interface Contract {
  id: string;
  freelancerId: string;
  clientName: string;
  clientEmail: string;
  clientRfc?: string;
  clientRegimen?: string;
  clientPostal?: string;
  
  scopeDescription: string;
  totalAmount: number;
  currency: 'MXN' | 'USD';
  status: ContractStatus;
  pdfUrl?: string;
  contractHash?: string;
  
  // Acceptance Info
  acceptedAt?: string;
  acceptedByName?: string;
  acceptedIp?: string;
  
  // Payment Details
  clabe?: string;
  bankName?: string;
  beneficiaryName?: string;
  
  // Freelancer Fiscal info at contract snapshot time
  freelancerRfc?: string;
  freelancerRegimen?: string;
  freelancerPostal?: string;
  
  created_at: string;
  updated_at: string;
}

export type MilestoneStatus = 'pending' | 'requested' | 'marked_paid' | 'confirmed';

export interface Milestone {
  id: string;
  contractId: string;
  label: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
  markedPaidAt?: string;
  confirmedAt?: string;
  trackingReference?: string; // SPEI Clave de Rastreo
  transferredAmount?: number; // Exact amount paid by client
  created_at: string;
}

export interface ClauseTemplate {
  id: string;
  category: 'general' | 'design' | 'development' | 'consulting';
  title: string;
  content: string;
}
