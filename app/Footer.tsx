"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide the footer completely if the route is part of the logged-in app or client portal
  if (
    pathname.startsWith("/c/") || 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/hash-verifier")
  ) {
    return null;
  }

  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-500 shadow-md">
                <span className="text-sm font-extrabold text-white">₳</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Anticipo<span className="text-xs text-slate-500 ml-1">MX</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              El software de contratos y cobranza diseñado exclusivamente para el marco legal de freelancers en México.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Producto</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/#beneficios" className="hover:text-indigo-600 transition-colors">Beneficios</Link></li>
              <li><Link href="/#precios" className="hover:text-indigo-600 transition-colors">Precios</Link></li>
              <li><Link href="/#como-funciona" className="hover:text-indigo-600 transition-colors">Cómo Funciona</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Legal & Ayuda</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/faq" className="hover:text-indigo-600 transition-colors">Preguntas Frecuentes</Link></li>
              <li><Link href="/terms" className="hover:text-indigo-600 transition-colors">Términos de Servicio</Link></li>
              <li><Link href="/privacy" className="hover:text-indigo-600 transition-colors">Aviso de Privacidad</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-200 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p className="font-medium">
            &copy; {new Date().getFullYear()} Anticipo MX. Creado para los freelancers en México.
          </p>
          <p className="text-slate-400 text-center md:text-right max-w-md">
            Aviso legal: Los formatos proveídos son plantillas de carácter ilustrativo y no constituyen asesoría legal.
          </p>
        </div>
      </div>
    </footer>
  );
}
