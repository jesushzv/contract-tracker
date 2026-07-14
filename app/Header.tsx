"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { LogOut } from "lucide-react";

interface HeaderProps {
  hasAuthCookie: boolean;
  useSupabase: boolean;
}

export default function Header({ hasAuthCookie, useSupabase }: HeaderProps) {

  // Hide the navbar completely if the user is not logged in
  if (!hasAuthCookie) {
    return null;
  }

  const panelUrl = (hasAuthCookie || !useSupabase) ? "/dashboard" : "/login";

  const handleLogout = async () => {
    if (useSupabase) {
      await supabase.auth.signOut();
    }
    // Clear cookies for mock mode as well
    document.cookie = "sb-mock-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    
    // Also remove the supabase cookies if they exist
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.startsWith("sb-")) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    }

    // Redirect to login page and reload
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#6366f1]/10 bg-white/70 backdrop-blur-md dark:bg-[#090d16]/70 dark:border-[#6366f1]/25 print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 shadow-md shadow-indigo-500/20">
            <span className="text-lg font-extrabold text-white">₳</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-emerald-400">
              Anticipo
            </span>
            <span className="text-xs font-semibold text-slate-400 ml-1 block sm:inline">MX</span>
          </div>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href={panelUrl} className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">
            Panel
          </Link>
          <Link href={(hasAuthCookie || !useSupabase) ? "/contracts/new" : "/login"} className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">
            Nuevo Contrato
          </Link>
          <Link href="/hash-verifier" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">
            Verificador
          </Link>
          <Link href={(hasAuthCookie || !useSupabase) ? "/documents" : "/login"} className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">
            Expedientes
          </Link>
          <Link href={(hasAuthCookie || !useSupabase) ? "/notifications" : "/login"} className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5">
            Notificaciones
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            href={panelUrl} 
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-all duration-200"
          >
            Mi Panel
          </Link>
          <button 
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-200"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
