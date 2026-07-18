"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LogOut } from "lucide-react";

interface HeaderProps {
  hasAuthCookie: boolean;
  useSupabase: boolean;
}

export default function Header({ hasAuthCookie, useSupabase }: HeaderProps) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(hasAuthCookie);

  useEffect(() => {
    // Check if user is logged in via cookies or demo mode
    const checkSession = () => {
      const cookies = document.cookie;
      const hasCookie = cookies.split(";").some((c) => {
        const trimmed = c.trim();
        if (trimmed === "demo_mode=true") return true;
        if (trimmed.startsWith("sb-") && trimmed.includes("-auth-token=")) {
          const valueStr = trimmed.substring(trimmed.indexOf("=") + 1);
          try {
            const decoded = decodeURIComponent(valueStr);
            const val = JSON.parse(decoded);
            if (val === true || val === "true") return true;
            if (val && typeof val === "object" && val.access_token) return true;
          } catch {
            if (valueStr === "true") return true;
          }
        }
        return false;
      });
      setIsLoggedIn(hasCookie);
    };
    checkSession();
  }, [pathname]);

  // Hide the header completely if the route is part of the logged-in app or client portal
  if (
    pathname.startsWith("/c/") || 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/hash-verifier") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  const showFullHeader = isLoggedIn;
  const panelUrl = showFullHeader ? "/dashboard" : "/login";

  const handleLogout = async () => {
    if (useSupabase) {
      await supabase.auth.signOut();
    }
    // Clear cookies for mock mode as well
    document.cookie = "sb-mock-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    
    // Remove demo mode from localStorage and cookies
    localStorage.removeItem("demo_mode");
    document.cookie = "demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

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
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/70 backdrop-blur-md dark:bg-[#090d16]/70 dark:border-primary/25 print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent shadow-md shadow-primary/20">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              <path d="M14 2v6h6" />
              <path d="m6 13 2 2 4-4" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Mi Pacto
            </span>
          </div>
        </Link>
        

        <div className="hidden lg:flex items-center gap-8 ml-8">
          <Link href="/#beneficios" className="text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-accent transition-colors">
            Beneficios
          </Link>
          <Link href="/#como-funciona" className="text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-accent transition-colors">
            Cómo Funciona
          </Link>
          <Link href="/#precios" className="text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-accent transition-colors">
            Precios
          </Link>
          <Link href="/faq" className="text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-accent transition-colors">
            FAQ
          </Link>
        </div>

        <div className="flex flex-1 justify-end items-center gap-2 md:gap-4">
          {showFullHeader ? (
            <>
              <Link 
                href={panelUrl} 
                className="inline-flex items-center justify-center rounded-xl bg-primary px-3 md:px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/10 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-primary dark:hover:bg-primary-dark transition-all duration-200"
              >
                Mi Panel
              </Link>
              <button 
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-2 md:px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800 transition-all duration-200"
                title="Cerrar Sesión"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </>
          ) : (
            pathname.startsWith("/login") ? (
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center rounded-xl bg-primary px-3 md:px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/10 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-primary dark:hover:bg-primary-dark transition-all duration-200"
              >
                Registrarse
              </Link>
            ) : (
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center rounded-xl bg-primary px-3 md:px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/10 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-primary dark:hover:bg-primary-dark transition-all duration-200"
              >
                Iniciar Sesión
              </Link>
            )
          )}

        </div>
      </div>
      

    </header>
  );
}
