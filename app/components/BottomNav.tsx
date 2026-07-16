import React from "react";
import Link from "next/link";
import { Briefcase, FileText, Settings, BarChart3 } from "lucide-react";

interface BottomNavProps {
  activePath?: string;
}

export function BottomNav({ activePath }: BottomNavProps) {
  const links = [
    { name: "Pipeline", href: "/dashboard", icon: Briefcase },
    { name: "Docs", href: "/documents", icon: FileText },
    { name: "Insights", href: "/insights", icon: BarChart3 },
    { name: "Ajustes", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
      <nav className="flex justify-around items-center h-16">
        {links.map((link) => {
          const isActive = activePath === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
              <span className="text-[10px] font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
