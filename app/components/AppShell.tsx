"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { Menu, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
interface AppShellProps {
  children: React.ReactNode;
  activePath?: string;
}

export function AppShell({ children, activePath = "/dashboard" }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = "sb-mock-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    localStorage.removeItem("demo_mode");
    sessionStorage.removeItem("demo_mode");
    document.cookie = "demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name.startsWith("sb-")) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    }
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar activePath={activePath} />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar activePath={activePath} onNavigate={() => setIsMobileMenuOpen(false)} />
      </div>
      
      <div className="flex-1 md:pl-64 flex flex-col w-full h-full relative">
        <header className="h-16 flex-shrink-0 border-b border-slate-200 bg-white flex justify-between md:justify-end items-center px-4 md:px-6">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <button 
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 md:px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-200"
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
