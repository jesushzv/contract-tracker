"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { isDemoMode } from "@/lib/storageClient";
import { AlertTriangle } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  activePath?: string;
}

export function AppShell({ children, activePath = "/dashboard" }: AppShellProps) {
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDemo(isDemoMode());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar activePath={activePath} />
      </div>
      
      <div className="flex-1 md:pl-64 flex flex-col w-full h-full">
        <header className="h-16 flex-shrink-0 border-b border-slate-200 bg-white flex justify-end items-center px-6">
          <NotificationBell />
        </header>
        
        {demo && (
          <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 flex items-center justify-center text-amber-800 dark:text-amber-300 text-sm font-semibold gap-2 z-40 relative">
            <AlertTriangle className="h-4 w-4" />
            MODO SANDBOX DEMO - Los datos mostrados son de prueba y no se guardarán permanentemente.
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
