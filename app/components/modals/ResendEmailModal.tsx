import React, { useState } from "react";
import { Contract } from "@/lib/types";
import { Send, Eye, X } from "lucide-react";

interface ResendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  onConfirm: (customMessage: string) => Promise<void>;
  isResending: boolean;
}

export function ResendEmailModal({ isOpen, onClose, contract, onConfirm, isResending }: ResendEmailModalProps) {
  const [customMessage, setCustomMessage] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:hidden">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-lg">Reenviar Invitación</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 space-y-6 flex-1">
          <div>
            <p className="text-sm text-slate-600 mb-4">
              Se enviará una invitación a <strong>{contract.clientName}</strong> ({contract.clientEmail}) con el enlace seguro al contrato.
            </p>
            
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mensaje Opcional
            </label>
            <textarea
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              rows={4}
              placeholder="Escribe un mensaje personalizado que se incluirá en el correo..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Este mensaje aparecerá destacado dentro del cuerpo del correo electrónico automático.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-700 mb-3 font-medium text-sm">
              <Eye className="w-4 h-4 text-slate-500" /> Vista previa del correo
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
              <p className="font-medium text-slate-900 mb-3 text-lg text-center">Propuesta de Servicios</p>
              <p>Hola {contract.clientName},</p>
              <p className="mt-2"><strong>Freelancer</strong> te ha enviado una propuesta de contrato por la cantidad de <strong>${contract.totalAmount.toLocaleString()} {contract.currency}</strong>.</p>
              <p className="mt-2">Puedes revisar los detalles del contrato, los hitos de pago y firmar electrónicamente de conformidad accediendo al siguiente enlace seguro:</p>
              
              {customMessage && (
                <div className="mt-4 p-4 bg-slate-50 border-l-4 border-blue-500 rounded-r-lg">
                  <p className="whitespace-pre-wrap">{customMessage}</p>
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <div className="bg-slate-900 text-white px-6 py-3 rounded-lg font-medium inline-block text-center cursor-default">
                  Revisar y Firmar Contrato
                </div>
              </div>
              
              <p className="mt-6 text-center text-xs">Si tienes alguna duda sobre el alcance o los términos, puedes proponer una revisión directamente desde la plataforma.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-slate-100 shrink-0">
          <button 
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
            onClick={onClose} 
            disabled={isResending}
          >
            Cancelar
          </button>
          <button 
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
            onClick={() => onConfirm(customMessage)} 
            disabled={isResending}
          >
            <Send className="w-4 h-4 mr-2" />
            {isResending ? 'Enviando...' : 'Enviar Correo'}
          </button>
        </div>
      </div>
    </div>
  );
}
