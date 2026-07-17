"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, FileText, Settings, BarChart3, CheckCircle, PlusCircle, Bell } from "lucide-react";
import { getProfile, isDemoMode } from "@/lib/storageClient";
import { Profile } from "@/lib/types";

interface SidebarProps {
  activePath?: string;
  onNavigate?: () => void;
}

export function Sidebar({ activePath, onNavigate }: SidebarProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile).catch(console.error);
    
    const timer = setTimeout(() => {
      setDemo(isDemoMode());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const links = [
    { name: "Nuevo Contrato", href: "/contracts/new", icon: PlusCircle },
    { name: "Pipeline", href: "/dashboard", icon: Briefcase },
    { name: "Documentos", href: "/dashboard/documents", icon: FileText },
    { name: "Notificaciones", href: "/notifications", icon: Bell },
    { name: "Insights", href: "/dashboard/insights", icon: BarChart3 },
    { name: "Verificador", href: "/hash-verifier", icon: CheckCircle },
    { name: "Configuración", href: "/dashboard/settings", icon: Settings },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = profile?.fullName || "Usuario";
  const displayTier = profile?.tier === "pro" ? "Pro Plan" : profile?.tier === "starter" ? "Starter Plan" : "Free Plan";
  const initials = getInitials(profile?.fullName);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 shadow-md shadow-indigo-500/20">
            <span className="text-lg font-extrabold text-white">₳</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Anticipo
            </span>
            <span className="text-xs font-semibold text-slate-400 ml-1 block sm:inline">MX</span>
          </div>
        </Link>
        
        {demo && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 w-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] font-mono font-medium tracking-widest text-indigo-300 uppercase">
              Sandbox Mode
            </span>
          </div>
        )}
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const isActive = activePath === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-slate-800 text-white" 
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-slate-400">{displayTier}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
