import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TaxBreakdownProps {
  subtotal: number;
  iva: number;
  retencionIsr: number;
  retencionIva: number;
  total: number;
  currency: string;
}

export function TaxBreakdown({ subtotal, iva, retencionIsr, retencionIva, total, currency }: TaxBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const format = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(val);

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-slate-900">Total a percibir</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-slate-900">{format(total)}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>{format(subtotal)}</span>
          </div>
          {iva > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>IVA (16%)</span>
              <span>+ {format(iva)}</span>
            </div>
          )}
          {retencionIsr > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Retención ISR (10%)</span>
              <span>- {format(retencionIsr)}</span>
            </div>
          )}
          {retencionIva > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Retención IVA (10.66%)</span>
              <span>- {format(retencionIva)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
