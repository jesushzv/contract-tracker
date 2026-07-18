import { Star } from "lucide-react";

interface StandingIndicatorProps {
  freelancerRfc?: string;
  memberSince?: string; // e.g. "Julio 2026"
}

export function StandingIndicator({ freelancerRfc, memberSince = "Julio 2026" }: StandingIndicatorProps) {
  return (
    <div className="glass rounded-3xl p-5 border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-4 text-left">
      <h3 className="text-sm font-bold flex items-center gap-1.5 text-emerald-600">
        <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
        Freelancer en Buena Posición
      </h3>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          Reputación de Confianza de Mi Pacto
        </div>
        <ul className="text-3xs text-slate-500 flex flex-col gap-1.5 leading-normal pl-1">
          <li className="flex items-center gap-1.5">✓ Identidad fiscal emisor validada (RFC {freelancerRfc ? "Registrado" : "N/A"})</li>
          <li className="flex items-center gap-1.5">✓ Sello de integridad criptográfica activo</li>
          <li className="flex items-center gap-1.5">✓ 0 penalizaciones ni disputas vigentes</li>
          <li className="flex items-center gap-1.5">✓ Hitos financieros protegidos por escrow</li>
        </ul>
        <div className="border-t border-slate-100 pt-2.5 mt-1 flex justify-between items-center text-3xs text-slate-400">
          <span>Miembro desde</span>
          <span className="font-semibold text-slate-600">{memberSince}</span>
        </div>
      </div>
    </div>
  );
}
