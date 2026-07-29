import { useState } from 'react';
import { Milestone } from '@/lib/types';


export function useMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [allMilestones, setAllMilestones] = useState<Milestone[]>([]);
  
  // Payment Proof States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMilestone, setPaymentMilestone] = useState<Milestone | null>(null);
  const [trackingReference, setTrackingReference] = useState("");
  const [transferredAmount, setTransferredAmount] = useState<number>(0);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptFileType, setReceiptFileType] = useState<'file' | 'url'>('file');
  const [receiptFileBase64, setReceiptFileBase64] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [receiptFileMimeType, setReceiptFileMimeType] = useState("");
  const [overrideExchangeRate, setOverrideExchangeRate] = useState("20.15");

  return {
    milestones,
    setMilestones,
    allMilestones,
    setAllMilestones,
    showPaymentModal,
    setShowPaymentModal,
    paymentMilestone,
    setPaymentMilestone,
    trackingReference,
    setTrackingReference,
    transferredAmount,
    setTransferredAmount,
    receiptUrl,
    setReceiptUrl,
    receiptFileType,
    setReceiptFileType,
    receiptFileBase64,
    setReceiptFileBase64,
    receiptFileName,
    setReceiptFileName,
    receiptFileMimeType,
    setReceiptFileMimeType,
    overrideExchangeRate,
    setOverrideExchangeRate
  };
}
