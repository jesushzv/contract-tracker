import React from "react";
import { AuditLog } from "@/lib/types";
import { CheckCircle2, Clock, Edit3, MessageCircle, FileText, X } from "lucide-react";

interface AuditTimelineProps {
  logs: AuditLog[];
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
  const getActionIcon = (action: string) => {
    switch(action) {
      case 'created': return <FileText className="w-4 h-4 text-slate-500" />;
      case 'modified': return <Edit3 className="w-4 h-4 text-amber-500" />;
      case 'signed': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'vetted': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'milestone_updated': return <Clock className="w-4 h-4 text-indigo-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-500" />;
      default: return <MessageCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {logs.map((log, i) => (
        <div key={log.id || i} className="relative flex gap-3">
          {i !== logs.length - 1 && (
            <div className="absolute left-[11px] top-6 bottom-[-16px] w-px bg-slate-200" />
          )}
          <div className="relative z-10 flex flex-col items-center pt-1">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              {getActionIcon(log.action)}
            </div>
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm text-slate-700">{log.details}</p>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(log.timestamp).toLocaleString("es-MX")} • {log.actor}
            </p>
          </div>
        </div>
      ))}
      {logs.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">No hay actividad registrada</p>
      )}
    </div>
  );
}
