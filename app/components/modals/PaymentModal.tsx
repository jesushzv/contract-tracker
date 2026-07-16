import React, { useState } from "react";
import { Milestone, Contract } from "@/lib/types";
import { Button } from "../ui/Button";
import { X } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone;
  contract: Contract;
  onConfirm: (data: { trackingReference: string; transferredAmount: number; receiptFileBase64: string; receiptFileName: string; receiptFileMimeType: string; exchangeRate: number }) => Promise<void>;
}

export function PaymentModal({ isOpen, onClose, milestone, contract, onConfirm }: PaymentModalProps) {
  const [trackingReference, setTrackingReference] = useState("");
  const [transferredAmount, setTransferredAmount] = useState<number>(milestone.amount);
  const [receiptFileBase64, setReceiptFileBase64] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [receiptFileMimeType, setReceiptFileMimeType] = useState("");
  const [exchangeRate, setExchangeRate] = useState(20.15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptFileBase64("");
      setReceiptFileName("");
      setReceiptFileMimeType("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo excede el límite de tamaño de 5MB.");
      return;
    }

    const allowedMimeTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedMimeTypes.includes(file.type)) {
      setError("Solo se permiten archivos PDF o imágenes (PNG, JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setReceiptFileBase64(base64Data);
      setReceiptFileName(file.name);
      setReceiptFileMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onConfirm({
        trackingReference,
        transferredAmount,
        receiptFileBase64,
        receiptFileName,
        receiptFileMimeType,
        exchangeRate
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900">Registrar Pago</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Referencia de Rastreo
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={trackingReference}
              onChange={(e) => setTrackingReference(e.target.value)}
              placeholder="Ej: AB123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Monto Transferido ({contract.currency})
            </label>
            <input
              type="number"
              required
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={transferredAmount}
              onChange={(e) => setTransferredAmount(parseFloat(e.target.value))}
            />
          </div>

          {contract.currency === "USD" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Cambio Aplicado
              </label>
              <input
                type="number"
                required
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Comprobante de Pago
            </label>
            <input
              type="file"
              required
              accept=".pdf,image/png,image/jpeg,image/jpg"
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              onChange={handleFileChange}
            />
          </div>
          
          <div className="pt-4 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button className="flex-1" type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Confirmar Pago"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
