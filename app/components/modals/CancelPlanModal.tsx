import React, { useState } from 'react';
import { AlertTriangle, Calendar, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface CancelPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cancelAt: string) => void;
  currentTier: 'free' | 'starter' | 'pro';
  activeContractsCount: number;
}

export const CancelPlanModal: React.FC<CancelPlanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentTier,
  activeContractsCount
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reason, setReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [cancelDate, setCancelDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const finalReason = reason === 'other' ? otherReason : reason;
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error al cancelar la suscripción');
      
      setCancelDate(new Date(data.cancelAt).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
      }));
      setStep(3);
      onSuccess(data.cancelAt);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setReason('');
    setOtherReason('');
    setError(null);
    onClose();
  };

  const freeLimitExceeded = activeContractsCount > 3;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-900/50 transition-opacity backdrop-blur-sm" onClick={handleClose} />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

        <div className="inline-block transform overflow-hidden rounded-3xl bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle border border-slate-200">
          
          <div className="absolute right-4 top-4">
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-500 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 pt-8 pb-6">
            
            {/* Step 1: Retention */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 text-center mb-2">
                  ¿Estás seguro que deseas cancelar?
                </h3>
                <p className="text-slate-600 text-center mb-6">
                  Al cambiar al plan Gratuito, perderás acceso a los beneficios de tu plan {currentTier === 'starter' ? 'Starter' : 'Pro'}:
                </p>
                
                <ul className="space-y-3 text-sm text-slate-700 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">−</span>
                    Límite de contratos ({currentTier === 'starter' ? '10 → 3' : 'Ilimitados → 3'})
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">−</span>
                    Pérdida de personalización de marca
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">−</span>
                    Sin acceso a plantillas premium
                  </li>
                </ul>

                {freeLimitExceeded && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-sm text-red-800">
                      <strong>Tienes {activeContractsCount} contratos activos.</strong> El límite del plan gratuito es 3. Si cancelas, no podrás crear nuevos contratos hasta que elimines o completes algunos.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button variant="primary" className="w-full justify-center" onClick={handleClose}>
                    Mantener mi plan
                  </Button>
                  <Button variant="ghost" className="w-full justify-center text-slate-500 hover:text-slate-700" onClick={() => setStep(2)}>
                    Continuar con la cancelación
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Reason Survey */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  ¿Nos cuentas por qué te vas?
                </h3>
                <p className="text-slate-600 text-sm mb-6">
                  Tus comentarios nos ayudan a mejorar la plataforma para freelancers como tú.
                </p>

                <div className="space-y-2 mb-6">
                  {[
                    { id: 'expensive', label: 'Es demasiado caro' },
                    { id: 'not_using', label: 'No uso la plataforma lo suficiente' },
                    { id: 'missing_features', label: 'Le faltan funciones que necesito' },
                    { id: 'alternative', label: 'Encontré una alternativa mejor' },
                    { id: 'temporary', label: 'Solo lo necesitaba temporalmente' },
                    { id: 'other', label: 'Otro motivo' },
                  ].map((option) => (
                    <label key={option.id} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${reason === option.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="reason"
                        value={option.id}
                        checked={reason === option.id}
                        onChange={(e) => setReason(e.target.value)}
                        className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                      />
                      <span className="ml-3 text-sm text-slate-700">{option.label}</span>
                    </label>
                  ))}
                </div>

                {reason === 'other' && (
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Cuéntanos más (opcional)"
                    className="w-full mb-6 rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    rows={3}
                  />
                )}

                {error && (
                  <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button variant="ghost" className="flex-1 justify-center" onClick={() => setStep(1)} disabled={isLoading}>
                    Volver
                  </Button>
                  <Button variant="danger" className="flex-1 justify-center" onClick={handleCancel} disabled={!reason || isLoading}>
                    {isLoading ? 'Cancelando...' : 'Cancelar Suscripción'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-center py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-6">
                  <Calendar className="h-8 w-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Suscripción Cancelada
                </h3>
                <p className="text-slate-600 mb-8">
                  Tu suscripción cambiará al plan Gratuito el <strong className="font-medium text-slate-900">{cancelDate}</strong>. Seguirás teniendo acceso a todas las funciones de tu plan actual hasta esa fecha.
                </p>
                <Button variant="primary" className="w-full justify-center" onClick={handleClose}>
                  Cerrar
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
