export interface Profile {
  id: string;
  email: string;
  fullName: string;
  rfc?: string;
  regimenFiscal?: string;
  codigoPostal?: string;
  logoUrl?: string;
  signatureUrl?: string;
  tier?: 'free' | 'starter' | 'pro';
  phone?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionCancelAt?: string;
  bankDetails: {
    clabe: string;
    bankName: string;
    beneficiaryName: string;
  };
  isAdmin?: boolean;
  facturapiOrganizationId?: string;
  facturapiLiveKey?: string;
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
  clientCfdiUse?: string;
  clientPhone?: string;
  
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

  // Double completion markers
  freelancerCompletedAt?: string;
  clientCompletedAt?: string;
  
  // Payment Details
  clabe?: string;
  bankName?: string;
  beneficiaryName?: string;
  paymentInstructions?: string;
  paymentProfileId?: string;
  
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
  satProductCode?: string;
  taxRegimeType?: string;

  // OTP Verification
  clientOtpCode?: string;
  clientOtpVerified?: boolean;
  clientOtpAttempts?: number;
  
  // Client Access Token
  clientAccessToken?: string;
  
  // Selected Legal Clauses
  selectedClauses?: string[];
  
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
  trackingReference?: string; // SPEI Clave de Rastreo (stored in DB as tracking_reference but client models use trackingReference or speiReference)
  transferredAmount?: number; // Exact amount paid by client
  receiptUrl?: string; // Attachment receipt URL/text
  exchangeRate?: number; // USD to MXN exchange rate
  mxnAmount?: number; // Amount converted to MXN
  receiptUploadedBy?: 'freelancer' | 'client';
  speiReference?: string;
  cfdiId?: string;
  cfdiXmlUrl?: string;
  cfdiPdfUrl?: string;
  cfdiStatus?: string;
  created_at: string;
}

export interface CsdCredential {
  id: string;
  freelancerId: string;
  certificateBase64: string;
  privateKeyEncrypted: string;
  passwordEncrypted: string;
  rfc: string;
  isActive: boolean;
  expiresAt?: string;
  created_at: string;
}

export interface ClauseTemplate {
  id: string;
  category: 'general' | 'design' | 'development' | 'consulting';
  title: string;
  content: string;
  legalBasis?: string;
}

export interface AuditLog {
  id: string;
  contractId: string;
  action: string; // 'created' | 'client_signed' | 'freelancer_accepted' | 'milestone_requested' | 'milestone_transferred' | 'milestone_confirmed' | 'modified' | 'revision_proposed' | 'contract_cancelled' | 'edit_requested' | 'edit_responded' etc.
  actor: 'freelancer' | 'client' | 'system';
  details: string;
  timestamp: string;
  ip?: string;
  signature?: string;
}

export interface ContractVersion {
  id: string;
  contractId: string;
  versionNumber: number;
  scopeDescription: string;
  totalAmount: number;
  currency: 'MXN' | 'USD';
  taxWithholdingAmount?: number;
  ivaAmount?: number;
  subtotalAmount?: number;
  modifiedAt: string;
  reason?: string;
}

export interface PaymentProfile {
  id: string;
  freelancerId: string;
  nickname: string;
  bankName: string;
  clabe: string;
  paymentInstructions?: string;
  isDefault: boolean;
  created_at?: string;
}

export interface EditRequest {
  id: string;
  contractId: string;
  requestedBy: 'freelancer' | 'client';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  proposedChanges: {
    scopeDescription?: string;
    totalAmount?: number;
    currency?: 'MXN' | 'USD';
    milestones?: Omit<Milestone, 'created_at'>[];
    clabe?: string;
    bankName?: string;
    beneficiaryName?: string;
    paymentInstructions?: string;
  };
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface Notification {
  id: string;
  userId: string;
  contractId?: string;
  eventType: string;
  message: string;
  isRead: boolean;
  created_at: string;
}

export interface UserFeedback {
  id: string;
  userId: string;
  userEmail?: string;
  category: 'bug' | 'feature-request' | 'question' | 'billing';
  subject: string;
  message: string;
  status: 'new' | 'in-progress' | 'resolved' | 'archived';
  adminReply?: string;
  created_at: string;
  replied_at?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_amount: number;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  is_active: boolean;
  stripe_coupon_id?: string;
  is_stripe_coupon: boolean;
  created_at: string;
  created_by?: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  target_audience: string;
  status: 'draft' | 'scheduled' | 'sent';
  sent_at?: string;
  sent_count: number;
  created_at: string;
}
