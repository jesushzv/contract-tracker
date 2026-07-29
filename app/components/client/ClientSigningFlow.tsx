import { ShieldCheck, User, Check, X, Loader2 } from "lucide-react";
import { Contract } from "@/lib/types";

interface ClientSigningFlowProps {
  showAcceptModal: boolean;
  setShowAcceptModal: (show: boolean) => void;
  acceptStep: 'name' | 'otp';
  setAcceptStep: (step: 'name' | 'otp') => void;
  signerName: string;
  setSignerName: (name: string) => void;
  otpInput: string;
  setOtpInput: (otp: string) => void;
  handleAcceptContract: (e: React.FormEvent) => void;
  debugOtp: string | null;
  otpError: string | null;
  otpAttempts: number;
  handleRegenerateOtp: () => void;
  loading: boolean;
  contract: Contract | null;
}

export function ClientSigningFlow({
  showAcceptModal,
  setShowAcceptModal,
  acceptStep,
  setAcceptStep,
  signerName,
  setSignerName,
  otpInput,
  setOtpInput,
  handleAcceptContract,
  debugOtp,
  otpError,
  otpAttempts,
  handleRegenerateOtp,
  loading,
  contract
}: ClientSigningFlowProps) {
  if (!showAcceptModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md print:hidden">
      <div className="relative glass rounded-3xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 text-left bg-white shadow-2xl border border-indigo-500/20">
        <button
          type="button"
          onClick={() => {
            setShowAcceptModal(false);
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 :bg-slate-900 text-slate-400 hover:text-slate-700 :text-slate-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-500">
          <ShieldCheck className="h-6 w-6" />
          Aceptar Contrato de Servicios
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Al escribir tu nombre completo a continuación, confirmas tu consentimiento y aceptación de todos los términos detallados en esta propuesta, incluyendo el alcance, la tarifa de ${contract?.totalAmount?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} {contract?.currency || 'MXN'}, el esquema de anticipos y las cláusulas de ley adjuntas.
        </p>

        {/* Steps indicator */}
        <div className="flex items-center justify-between w-full mt-4 mb-5 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${acceptStep === 'name' ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-emerald-500 text-white'}`}>
              {acceptStep === 'otp' ? <Check className="h-3.5 w-3.5" /> : "1"}
            </span>
            <span className={`text-xs font-semibold ${acceptStep === 'name' ? 'text-indigo-650 font-bold' : 'text-slate-450 '}`}>
              Identidad
            </span>
          </div>
          <div className="h-[1px] flex-1 mx-3 bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${acceptStep === 'otp' ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-slate-100 text-slate-400 '}`}>
              2
            </span>
            <span className={`text-xs font-semibold ${acceptStep === 'otp' ? 'text-indigo-650 font-bold' : 'text-slate-450 '}`}>
              Código OTP
            </span>
          </div>
        </div>

        <form onSubmit={handleAcceptContract} className="mt-4 flex flex-col gap-4">
          {acceptStep === 'name' ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Nombre completo del Firmante</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Escribe tu nombre y apellido"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-350 bg-transparent pl-10 pr-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all duration-300"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {debugOtp && (
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-4 text-xs text-indigo-300 font-mono leading-relaxed shadow-lg flex items-start gap-3">
                  <span className="text-base select-none mt-0.5">📟</span>
                  <div className="flex-1">
                    <strong className="text-indigo-455 font-bold block mb-1">SYSTEM_DEBUG_OTP</strong>
                    <span>El código de firma OTP es: </span>
                    <span className="font-black text-white bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 tracking-wider select-all">{debugOtp}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Código de Firma Electrónica (OTP de 6 dígitos)</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  disabled={otpAttempts >= 3}
                  placeholder="••••••"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-2xl border border-slate-350 bg-slate-50/50 px-4 py-3 text-2xl font-black text-center tracking-[0.5em] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none disabled:opacity-50 font-mono transition-all duration-300"
                />
              </div>
              {otpError && (
                <span className="text-xs text-red-500 font-semibold">{otpError}</span>
              )}
              {otpAttempts >= 3 && (
                <button
                  type="button"
                  onClick={handleRegenerateOtp}
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-400 text-left underline focus:outline-none"
                >
                  Generar un nuevo código OTP
                </button>
              )}
            </div>
          )}

          <p className="text-[11px] text-slate-450 leading-normal">
            Al firmar, aceptas que este mecanismo electrónico tiene idéntica validez que una firma autógrafa. Guardaremos tu nombre completo, marca de tiempo y dirección IP para el registro de auditoría digital, de conformidad con el <strong>Art. 89 del Código de Comercio de México</strong> y el <strong>Código Civil Federal</strong>.
          </p>

          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={() => {
                if (acceptStep === 'otp') {
                  setAcceptStep('name');
                } else {
                  setShowAcceptModal(false);
                }
              }}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 :text-slate-200 transition-colors"
            >
              {acceptStep === 'otp' ? "Atrás" : "Cancelar"}
            </button>
            <button
              type="submit"
              disabled={loading || (acceptStep === 'name' ? !signerName : (otpInput.length < 6 || otpAttempts >= 3))}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Firmando...
                </>
              ) : (
                acceptStep === 'name' ? "Continuar" : "Firmar Contrato"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
