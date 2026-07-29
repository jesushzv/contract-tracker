import React, { useState } from "react";
import { Button } from "../ui/Button";
import { X, AlertCircle } from "lucide-react";

interface RevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: (reason?: string) => Promise<void>;
  requireReason?: boolean;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export function RevisionModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  onConfirm, 
  requireReason = false,
  confirmLabel = "Confirmar",
  isDestructive = false
}: RevisionModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requireReason && !reason.trim()) {
      setError("Por favor, ingresa un motivo.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await onConfirm(reason);
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
          <div className="flex items-center gap-2">
            {isDestructive && <AlertCircle className="w-5 h-5 text-red-500" />}
            <h2 className={`text-lg font-semibold ${isDestructive ? 'text-red-600' : 'text-slate-900'}`}>
              {title}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            {message}
          </p>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}
          
          {requireReason && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Motivo (Obligatorio)
              </label>
              <textarea
                required
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explica brevemente el motivo de esta acción..."
              />
            </div>
          )}
          
          <div className="pt-4 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button 
              className="flex-1" 
              variant={isDestructive ? "danger" : "primary"}
              type="submit" 
              disabled={loading}
            >
              {loading ? "Procesando..." : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
