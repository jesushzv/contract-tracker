export interface Profile {
  id: string;
  email: string;
  fullName: string;
  rfc?: string;
  regimenFiscal?: string;
  codigoPostal?: string;
  logoUrl?: string;
  signatureUrl?: string;
  bankDetails: {
    clabe: string;
    bankName: string;
    beneficiaryName: string;
  };
}

export type ContractStatus = 'draft' | 'sent' | 'client_signed' | 'accepted' | 'completed' | 'cancelled';

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
  
  // Client Acceptance Info
  acceptedAt?: string;
  acceptedByName?: string;
  acceptedIp?: string;

  // Freelancer Acceptance Info (Double-Acceptance Vetting)
  freelancerAcceptedAt?: string;
  freelancerAcceptedByName?: string;
  freelancerAcceptedIp?: string;
  
  // Payment Details
  clabe?: string;
  bankName?: string;
  beneficiaryName?: string;
  
  // Freelancer Fiscal info at contract snapshot time
  freelancerRfc?: string;
  freelancerRegimen?: string;
  freelancerPostal?: string;

  // Tax details
  retencionIsr?: boolean;
  retencionIva?: boolean;
  taxWithholdingAmount?: number;
  ivaAmount?: number;
  subtotalAmount?: number;

  // OTP Verification
  clientOtpCode?: string;
  clientOtpVerified?: boolean;
  
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
  receiptUrl?: string; // Attachment receipt URL/text
  created_at: string;
}

export interface ClauseTemplate {
  id: string;
  category: 'general' | 'design' | 'development' | 'consulting';
  title: string;
  content: string;
}

export interface AuditLog {
  id: string;
  contractId: string;
  action: 'created' | 'client_signed' | 'freelancer_accepted' | 'milestone_requested' | 'milestone_transferred' | 'milestone_confirmed' | 'modified';
  actor: 'freelancer' | 'client' | 'system';
  details: string;
  timestamp: string;
  ip?: string;
  signature?: string;
}
