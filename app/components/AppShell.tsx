"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";

interface AppShellProps {
  children: React.ReactNode;
  activePath?: string;
}

export function AppShell({ children, activePath = "/dashboard" }: AppShellProps) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar activePath={activePath} />
      </div>
      
      <div className="flex-1 md:pl-64 flex flex-col w-full h-full">
        <header className="h-16 flex-shrink-0 border-b border-slate-200 bg-white flex justify-end items-center px-6">
          <NotificationBell />
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
