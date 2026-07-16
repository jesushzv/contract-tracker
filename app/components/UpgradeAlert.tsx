"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

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
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <Lock className="h-6 w-6" />
        </div>
        <h4 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </h4>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {description} Requiere plan <strong>{planNeeded}</strong>.
        </p>
        <Link
          href="/plans"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
        >
          Mejorar Plan
        </Link>
      </div>
      <div className="opacity-30 select-none pointer-events-none p-4 blur-[2px]">
        {children || (
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        )}
      </div>
    </div>
  );
}
