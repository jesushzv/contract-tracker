"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default function DemoLeadCaptureBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm">
      <div className="flex items-center gap-2 max-w-2xl">
        <Sparkles className="h-4 w-4 text-emerald-400 flex-shrink-0 animate-pulse" />
        <span>
          <strong>Estás explorando en Modo Demo (Sandbox).</strong> Registra tu cuenta gratis para guardar y firmar tus contratos reales.
        </span>
      </div>
      <Link
        href="/register"
        className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 rounded-lg transition-colors flex-shrink-0 text-xs"
      >
        Crear Cuenta Gratis
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
