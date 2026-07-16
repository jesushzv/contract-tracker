"use client";

import { AppShell } from "../../components/AppShell";
import { BarChart3 } from "lucide-react";

export default function InsightsPage() {
  return (
    <AppShell activePath="/dashboard/insights">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex-grow flex flex-col gap-6 text-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Insights y Estadísticas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Métricas de crecimiento y rendimiento de tu negocio.
          </p>
        </div>

        <div className="glass rounded-3xl border border-slate-200 bg-white/40 overflow-hidden shadow-sm">
          <div className="text-center py-16 text-slate-450 text-sm flex flex-col items-center justify-center gap-3">
            <BarChart3 className="h-10 w-10 text-slate-350" />
            <h4 className="font-bold text-sm text-slate-800">Próximamente</h4>
            <p className="text-xs text-slate-400">Esta sección está en construcción.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
