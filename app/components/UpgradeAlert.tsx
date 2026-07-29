"use client";



interface UpgradeAlertProps {
  title?: string;
  description?: string;
  planNeeded?: string;
  children?: React.ReactNode;
}

export function UpgradeAlert({
  title = "Característica Premium",
  description = "Sube a un plan de pago para desbloquear esta funcionalidad.",
  planNeeded = "Starter o Pro",
  children
}: UpgradeAlertProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
      <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
        <h4 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </h4>
        <p className="mb-0 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {description} Requiere plan <strong>{planNeeded}</strong>.
        </p>
      </div>
      <div className="opacity-30 select-none pointer-events-none p-4 blur-[2px]">
        {children || (
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        )}
      </div>
    </div>
  );
}
