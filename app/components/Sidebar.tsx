import React from "react";
import Link from "next/link";
import { Briefcase, FileText, Settings, BarChart3 } from "lucide-react";

interface SidebarProps {
  activePath?: string;
}

export function Sidebar({ activePath }: SidebarProps) {
  const links = [
    { name: "Pipeline", href: "/dashboard", icon: Briefcase },
    { name: "Documentos", href: "/dashboard/documents", icon: FileText },
    { name: "Insights", href: "/dashboard/insights", icon: BarChart3 },
    { name: "Configuración", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      <div className="p-6">
        <span className="text-xl font-bold text-white tracking-tight">ContractTracker</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const isActive = activePath === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
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
            HG
          </div>
          <div>
            <p className="text-sm font-medium text-white">Héctor G.</p>
            <p className="text-xs text-slate-400">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
