import { CreditCard, Upload, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Contract, Milestone } from "@/lib/types";

interface ClientPaymentUploadProps {
  showPaymentModal: boolean;
  setShowPaymentModal: (show: boolean) => void;
  paymentMilestone: Milestone | null;
  setPaymentMilestone: (milestone: Milestone | null) => void;
  contract: Contract | null;
  handleMarkAsTransferred: (e: React.FormEvent) => void;
  trackingReference: string;
  setTrackingReference: (ref: string) => void;
  transferredAmount: number;
  setTransferredAmount: (amount: number) => void;
  overrideExchangeRate: string;
  setOverrideExchangeRate: (rate: string) => void;
  receiptFileType: 'file' | 'url';
  setReceiptFileType: (type: 'file' | 'url') => void;
  receiptUrl: string;
  setReceiptUrl: (url: string) => void;
  receiptFileName: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  modalError: string | null;
  loading: boolean;
}

export function ClientPaymentUpload({
  showPaymentModal,
  setShowPaymentModal,
  paymentMilestone,
  setPaymentMilestone,
  contract,
  handleMarkAsTransferred,
  trackingReference,
  setTrackingReference,
  transferredAmount,
  setTransferredAmount,
  overrideExchangeRate,
  setOverrideExchangeRate,
  receiptFileType,
  setReceiptFileType,
  receiptUrl,
  setReceiptUrl,
  receiptFileName,
  handleFileChange,
  modalError,
  loading
}: ClientPaymentUploadProps) {
  if (!showPaymentModal || !paymentMilestone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md print:hidden">
      <div className="relative glass rounded-3xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 text-left bg-white shadow-2xl border border-indigo-500/20">
        <button
          type="button"
          onClick={() => {
            setShowPaymentModal(false);
            setPaymentMilestone(null);
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 :bg-slate-900 text-slate-400 hover:text-slate-700 :text-slate-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-500">
          <CreditCard className="h-6 w-6" />
          Notificar Transferencia SPEI
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Por favor ingresa la **Clave de Rastreo** de tu transferencia bancaria (se obtiene de tu recibo SPEI, CEP o banca móvil). Esto ayudará al freelancer a asociar tu pago de forma instantánea.
        </p>

        <form onSubmit={handleMarkAsTransferred} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Clave de Rastreo SPEI / Referencia</label>
            <input
              type="text"
              required
              placeholder="Ej. 182746182903485761 o folio"
              value={trackingReference}
              onChange={(e) => setTrackingReference(e.target.value)}
              className="w-full rounded-xl border border-slate-350 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none font-mono transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Monto Transferido ({contract?.currency})</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                required
                value={transferredAmount}
                onChange={(e) => setTransferredAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-350 bg-transparent pl-7 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none font-bold transition-all duration-300"
              />
            </div>
          </div>
          {contract?.currency === "USD" && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tipo de Cambio (Banxico sugerido: 20.15)</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={overrideExchangeRate}
                  onChange={(e) => setOverrideExchangeRate(e.target.value)}
                  className="w-full rounded-xl border border-slate-355 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none font-mono transition-all duration-300"
                />
              </div>

              <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/5 border border-indigo-500/15 rounded-xl p-4 text-xs flex flex-col gap-2 shadow-inner">
                <div className="flex justify-between text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <span>Monto en USD:</span>
                  <span className="font-bold text-slate-700">${transferredAmount.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <span>Tipo de Cambio:</span>
                  <span className="font-bold text-slate-700">${(parseFloat(overrideExchangeRate) || 20.15).toFixed(4)} MXN</span>
                </div>
                <div className="flex justify-between items-center text-indigo-600 font-bold border-t border-slate-200 pt-2.5 mt-1">
                  <span className="text-[11px] uppercase tracking-wider">Total a Transferir:</span>
                  <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 to-purple-600">
                    ${(transferredAmount * (parseFloat(overrideExchangeRate) || 20.15)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </span>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Método de Comprobante
            </label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-655 cursor-pointer">
                <input
                  type="radio"
                  name="receiptFileType"
                  checked={receiptFileType === 'file'}
                  onChange={() => setReceiptFileType('file')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Subir Archivo (PDF, PNG, JPG)
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-655 cursor-pointer">
                <input
                  type="radio"
                  name="receiptFileType"
                  checked={receiptFileType === 'url'}
                  onChange={() => setReceiptFileType('url')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                Enlace URL
              </label>
            </div>

            {receiptFileType === 'file' ? (
              <div className="flex flex-col gap-2">
                <label 
                  htmlFor="receipt-file-input"
                  className="group relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-indigo-500 :border-indigo-500/80 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/10 :bg-indigo-950/10 transition-all duration-300"
                >
                  <input
                    type="file"
                    id="receipt-file-input"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="p-3 rounded-full bg-slate-100 text-slate-500 group-hover:bg-indigo-100/50 :bg-indigo-950/50 group-hover:text-indigo-500 transition-colors duration-300">
                    <Upload className="h-6 w-6 group-hover:animate-bounce" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 mt-3 group-hover:text-indigo-500 transition-colors">
                    {receiptFileName ? receiptFileName : "Selecciona o arrastra tu comprobante"}
                  </span>
                  <p className="text-[10px] text-slate-450 mt-1">
                    PDF, PNG, JPG hasta 5MB
                  </p>
                </label>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Ej. https://dropbox.com/s/recibo.pdf o captura.png"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-355 bg-transparent px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all duration-300"
              />
            )}
          </div>

          {modalError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-655 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={() => {
                setShowPaymentModal(false);
                setPaymentMilestone(null);
              }}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 :text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !trackingReference}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Notificar Pago
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
