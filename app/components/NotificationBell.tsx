import React, { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = 2; // Mock

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Notificaciones</h3>
              <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:text-indigo-700">
                Marcar todas leídas
              </span>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                <p className="text-sm text-slate-800"><span className="font-medium">Studio Flora</span> ha firmado el contrato.</p>
                <p className="text-xs text-slate-400 mt-1">Hace 2 horas</p>
              </div>
              <div className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                <p className="text-sm text-slate-800"><span className="font-medium">Tech Solutions</span> ha subido un comprobante de pago.</p>
                <p className="text-xs text-slate-400 mt-1">Ayer</p>
              </div>
            </div>
            
            <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
              <Link 
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 block w-full"
              >
                Ver todas
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
