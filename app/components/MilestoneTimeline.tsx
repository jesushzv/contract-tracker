import React from "react";
import { Milestone } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { CheckCircle2, Clock } from "lucide-react";

interface MilestoneTimelineProps {
  milestones: Milestone[];
  currency: string;
}

export function MilestoneTimeline({ milestones, currency }: MilestoneTimelineProps) {
  const getMilestoneIcon = (status: string) => {
    if (status === 'confirmed') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (status === 'marked_paid') return <Clock className="w-5 h-5 text-amber-500" />;
    return <div className="w-3 h-3 rounded-full bg-slate-300 mt-1" />;
  };

  const getMilestoneStatus = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge variant="success">Pagado</Badge>;
      case 'marked_paid': return <Badge variant="warning">En revisión</Badge>;
      case 'requested': return <Badge variant="info">Solicitado</Badge>;
      default: return <Badge variant="default">Pendiente</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {milestones.map((m, i) => (
        <div key={m.id} className="relative flex gap-4">
          {i !== milestones.length - 1 && (
            <div className="absolute left-2.5 top-6 bottom-[-16px] w-px bg-slate-200" />
          )}
          <div className="relative z-10 flex flex-col items-center pt-0.5">
            {getMilestoneIcon(m.status)}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-slate-900">{m.label || `Hito ${i + 1}`}</h4>
                <p className="text-sm text-slate-500">Vence: {m.dueDate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(m.amount)}
                </p>
                <div className="mt-1">{getMilestoneStatus(m.status)}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
