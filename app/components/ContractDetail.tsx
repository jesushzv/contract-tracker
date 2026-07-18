import React, { useState } from "react";
import { Contract, Milestone, AuditLog } from "@/lib/types";
import { SlideOver } from "./ui/SlideOver";
import { MilestoneTimeline } from "./MilestoneTimeline";
import { AuditTimeline } from "./AuditTimeline";
import { TaxBreakdown } from "./TaxBreakdown";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Copy, Edit2, ShieldCheck, AlertTriangle, ExternalLink, MessageCircle, Mail } from "lucide-react";
import { FreelancerEditModal } from "./modals/FreelancerEditModal";
import { ResendEmailModal } from "./modals/ResendEmailModal";
import { vetAndAcceptContract, cancelContract, resendContractEmail } from "@/lib/storageClient";

interface ContractDetailProps {
  contract: Contract | null;
  milestones: Milestone[];
  logs: AuditLog[];
  isOpen: boolean;
  onClose: () => void;
  onCopyLink: (id: string) => void;
  onRefresh?: () => void;
  onUpdateMilestone?: (id: string, status: string) => void;
  onOpenPaymentModal?: (milestone: Milestone) => void;
  showToast?: (msg: string, type?: 'success'|'error') => void;
}

export function ContractDetail({ 
  contract, 
  milestones, 
  logs, 
  isOpen, 
  onClose,
  onCopyLink,
  onRefresh,
  onUpdateMilestone,
  onOpenPaymentModal,
  showToast
}: ContractDetailProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'milestones' | 'activity' | 'comms'>('info');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCounterSignConfirm, setShowCounterSignConfirm] = useState(false);
  const [isCounterSigning, setIsCounterSigning] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);

  // Cancellation state
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    onCopyLink(contract!.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCancelContract = async () => {
    try {
      setIsCanceling(true);
      await cancelContract(contract!.id, 'freelancer', cancelReason);
      setShowCancelConfirm(false);
      setShowCancelReason(false);
      if (showToast) showToast("Contrato cancelado exitosamente", "success");
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      if (showToast) showToast("Error: " + error.message, "error");
      else alert("Error: " + error.message);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleGenerateInvoice = async (milestone: Milestone) => {
    try {
      if (!contract) return;
      if (showToast) showToast("Emitiendo factura...", "success");
      
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: milestone.id,
          contractId: contract.id,
          freelancerId: contract.freelancerId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "NO_CSD") {
          throw new Error("No tienes un CSD activo. Configúralo en Configuración > Branding.");
        }
        throw new Error(data.error || "Fallo al generar factura");
      }
      
      if (showToast) showToast("Factura emitida con éxito", "success");
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al emitir CFDI.";
      if (showToast) showToast("Error: " + message, "error");
      else alert("Error: " + message);
    }
  };

  if (!contract) return null;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft': return <Badge variant="default">Borrador</Badge>;
      case 'sent': return <Badge variant="info">Enviado</Badge>;
      case 'client_signed': return <Badge variant="warning">Firmado por Cliente</Badge>;
      case 'accepted': return <Badge variant="success">Sellado</Badge>;
      case 'completed': return <Badge variant="success">Completado</Badge>;
      case 'cancelled': return <Badge variant="error">Cancelado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Detalle de Contrato">
      <div className="flex flex-col h-full -mx-4 -mt-6">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 mr-4">
              <h2 className="text-xl font-semibold text-slate-900">{contract.clientName}</h2>
              <p className="text-sm text-slate-500 mt-1">{contract.scopeDescription}</p>
            </div>
            {getStatusBadge(contract.status)}
          </div>

          <div className="flex gap-4 border-b border-slate-200">
            <button 
              className={`pb-2 text-sm font-medium ${activeTab === 'info' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('info')}
            >
              Información
            </button>
            <button 
              className={`pb-2 text-sm font-medium ${activeTab === 'milestones' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('milestones')}
            >
              Hitos
            </button>
            <button 
              className={`pb-2 text-sm font-medium ${activeTab === 'activity' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('activity')}
            >
              Actividad
            </button>
            <button 
              className={`pb-2 text-sm font-medium ${activeTab === 'comms' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('comms')}
            >
              Comunicación
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <TaxBreakdown 
                subtotal={contract.subtotalAmount || contract.totalAmount}
                iva={contract.ivaAmount || 0}
                retencionIsr={contract.taxWithholdingAmount || 0} // Using as fallback for visual representation
                retencionIva={0}
                total={contract.totalAmount}
                currency={contract.currency}
              />

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Detalles del Cliente</h3>
                <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
                  <p className="flex flex-col sm:flex-row sm:gap-2">
                    <span className="text-slate-500">Email:</span> 
                    <span className="text-slate-900 font-medium break-all">{contract.clientEmail}</span>
                  </p>
                  {contract.clientPhone && (
                    <p className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-slate-500">Teléfono:</span> 
                      <span className="text-slate-900 font-medium">{contract.clientPhone}</span>
                    </p>
                  )}
                  {contract.clientRfc && (
                    <p className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-slate-500">RFC:</span> 
                      <span className="text-slate-900 font-medium">{contract.clientRfc}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <MilestoneTimeline 
              milestones={milestones} 
              currency={contract.currency}
              onUpdateMilestone={onUpdateMilestone}
              onOpenPaymentModal={onOpenPaymentModal}
              onGenerateInvoice={handleGenerateInvoice}
            />
          )}

          {activeTab === 'activity' && (
            <AuditTimeline logs={logs} />
          )}

          {activeTab === 'comms' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Mensajes Rápidos por WhatsApp</h3>
                <p className="text-xs text-slate-500 mb-4">Envía mensajes pre-armados a tu cliente. Asegúrate de tener registrado su teléfono.</p>
                
                {contract.clientPhone ? (
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        const token = contract.clientAccessToken || `token-${contract.id}`;
                        const url = `${window.location.origin}/c/${contract.id}?demo=true&token=${token}`;
                        const message = `Hola ${contract.clientName}, te comparto el enlace seguro para revisar y firmar tu contrato: ${url}`;
                        window.open(`https://wa.me/${(contract.clientPhone || '').replace(/\D/g,'')}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="w-full flex items-center justify-between bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#075E54] px-4 py-3 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-[#25D366]" />
                        <span className="font-medium text-sm">Enviar link del contrato</span>
                      </div>
                      <ExternalLink className="w-4 h-4 opacity-50" />
                    </button>

                    <button 
                      onClick={() => {
                        const token = contract.clientAccessToken || `token-${contract.id}`;
                        const url = `${window.location.origin}/c/${contract.id}?demo=true&token=${token}`;
                        const message = `Hola ${contract.clientName}, te escribo para recordarte el pago pendiente de nuestro proyecto. Puedes ver los detalles aquí: ${url}`;
                        window.open(`https://wa.me/${(contract.clientPhone || '').replace(/\D/g,'')}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-3 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-slate-400" />
                        <span className="font-medium text-sm">Recordatorio de pago</span>
                      </div>
                      <ExternalLink className="w-4 h-4 opacity-50" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200 flex flex-col items-center justify-center text-center">
                    <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
                    <p className="text-sm font-medium">No hay teléfono registrado</p>
                    <p className="text-xs mt-1 opacity-80">Agrega el teléfono de tu cliente editando la propuesta para poder enviar mensajes por WhatsApp.</p>
                  </div>
                )}
              </div>

              {contract.status !== 'draft' && (
                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Correos Electrónicos</h3>
                  <p className="text-xs text-slate-500 mb-4">Reenvía la invitación por correo electrónico al cliente para que revise y firme el contrato.</p>
                  
                  <button 
                    onClick={() => {
                      if (!contract.clientEmail) {
                        showToast?.('No hay correo registrado', 'error');
                        return;
                      }
                      setShowResendModal(true);
                    }}
                    disabled={isResendingEmail}
                    className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <span className="font-medium text-sm">{isResendingEmail ? 'Reenviando...' : 'Reenviar invitación por correo'}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 left-0 right-0 p-4 md:p-6 border-t border-slate-200 bg-white md:bg-slate-50 flex flex-wrap gap-2 md:gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none pb-safe">
          <Button 
            variant="secondary" 
            className={`flex-1 min-w-[140px] transition-all duration-300 ${isCopied ? 'bg-green-50 text-green-700 border-green-200 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]' : ''}`} 
            onClick={handleCopyLink}
          >
            <Copy className="w-4 h-4 mr-2" />
            {isCopied ? "Copiado ✓" : "Copiar Link"}
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1 min-w-[140px]" 
            onClick={() => {
              const token = contract.clientAccessToken || `token-${contract.id}`;
              window.open(`/c/${contract.id}?demo=true&token=${token}`, '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Contrato
          </Button>
          {contract.status !== 'cancelled' && (
            <Button variant="secondary" className="flex-1 min-w-[140px]" onClick={() => setIsEditModalOpen(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Modificar Propuesta
            </Button>
          )}
          {contract.status === 'client_signed' && (
            <Button variant="primary" className="flex-1 min-w-[140px] bg-purple-600 hover:bg-purple-500" onClick={() => setShowCounterSignConfirm(true)}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              Validar y Contra-firmar
            </Button>
          )}
          <Button className="flex-1 min-w-[140px]" variant="danger" onClick={() => setShowCancelReason(true)}>
            Cancelar Contrato
          </Button>
        </div>
      </div>
      {isEditModalOpen && (
        <FreelancerEditModal
          contract={contract}
          milestones={milestones}
          onClose={() => setIsEditModalOpen(false)}
          onRefresh={onRefresh || (() => {})}
        />
      )}
      
      {showCounterSignConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900">Contra-firmar y Sellar Contrato</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm">
              Al confirmar, validas que el cliente ha firmado y que aceptas iniciar el proyecto. El contrato cambiará a estado &apos;Activo&apos;.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowCounterSignConfirm(false)} 
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                disabled={isCounterSigning}
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  setIsCounterSigning(true);
                  try {
                    await vetAndAcceptContract(contract.id, "Héctor J. Guerrero"); // Freelancer name hardcoded or from profile
                    setShowCounterSignConfirm(false);
                    if (showToast) showToast("Contrato contra-firmado exitosamente", "success");
                    onRefresh?.();
                  } catch (err) {
                    console.error("Failed to counter sign:", err);
                    if (showToast) showToast("Error al contra-firmar", "error");
                    else alert("Error al contra-firmar");
                  } finally {
                    setIsCounterSigning(false);
                  }
                }} 
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2"
                disabled={isCounterSigning}
              >
                {isCounterSigning ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Motivo de Cancelación</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ej. Incumplimiento de pagos..."
              className="w-full h-32 p-3 border border-slate-300 rounded-lg bg-transparent text-slate-900"
            />
            <div className="flex gap-3 justify-end mt-4">
              <Button variant="secondary" onClick={() => setShowCancelReason(false)}>Atrás</Button>
              <Button onClick={() => setShowCancelConfirm(true)}>Confirmar Cancelación</Button>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Cancelar Contrato</h3>
              <p className="text-slate-600 mb-6">
                ¿Estás seguro de que deseas cancelar este contrato? Esta acción es irreversible.
              </p>
              <div className="flex gap-3 w-full">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCancelConfirm(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="danger" 
                  className="flex-1" 
                  onClick={handleCancelContract}
                  isLoading={isCanceling}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resend Email Modal */}
      <ResendEmailModal
        isOpen={showResendModal}
        onClose={() => !isResendingEmail && setShowResendModal(false)}
        contract={contract!}
        isResending={isResendingEmail}
        onConfirm={async (customMessage) => {
          setIsResendingEmail(true);
          try {
            const success = await resendContractEmail(contract!.id, customMessage);
            if (success) {
              showToast?.('Correo reenviado con éxito', 'success');
              setShowResendModal(false);
            } else {
              showToast?.('No se pudo reenviar el correo', 'error');
            }
          } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Error al reenviar correo.";
            showToast?.(message, 'error');
          } finally {
            setIsResendingEmail(false);
          }
        }}
      />
    </SlideOver>
  );
}
