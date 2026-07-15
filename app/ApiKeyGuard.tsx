"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ApiKeyGuard({ children }: { children: React.ReactNode }) {
  const [isLeaked, setIsLeaked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) return;

    if (key.startsWith("sb_secret_")) {
      setTimeout(() => {
        setIsLeaked(true);
        setErrorMessage(
          "Se ha detectado una clave 'service_role' (sb_secret_...) en NEXT_PUBLIC_SUPABASE_ANON_KEY. Esta clave tiene privilegios de administrador que evitan las políticas de seguridad de base de datos (RLS) y NUNCA debe exponerse en el navegador web."
        );
      }, 0);
      return;
    }

    try {
      const parts = key.split(".");
      if (parts.length === 3) {
        // Decode JWT payload
        const payloadDecoded = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(payloadDecoded);
        
        if (payload?.role === "service_role") {
          setTimeout(() => {
            setIsLeaked(true);
            setErrorMessage(
              "Se ha detectado una clave 'service_role' en NEXT_PUBLIC_SUPABASE_ANON_KEY. Esta clave tiene privilegios de administrador que evitan las políticas de seguridad de base de datos (RLS) y NUNCA debe exponerse en el navegador web."
            );
          }, 0);
        }
      }
    } catch (e) {
      console.error("Error al validar clave Supabase:", e);
    }
  }, []);

  useEffect(() => {
    // Sync Supabase auth session to cookies so server components/actions can read it
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const cookieValue = JSON.stringify({
          access_token: session.access_token,
          user: {
            id: session.user.id,
            email: session.user.email
          }
        });
        const isSecure = window.location.protocol === "https:";
        const secureFlag = isSecure ? "; Secure" : "";
        document.cookie = `sb-auth-token=${encodeURIComponent(cookieValue)}; path=/; max-age=${session.expires_in || 3600}; SameSite=Lax${secureFlag}`;
      } else {
        // Clear the cookie when signed out, unless in demo mode
        const isDemo = localStorage.getItem("demo_mode") === "true";
        if (!isDemo) {
          document.cookie = "sb-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLeaked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-white overflow-y-auto">
        <div className="max-w-2xl w-full glass rounded-3xl p-8 border border-red-500/30 flex flex-col gap-6 bg-slate-900/90 shadow-2xl relative overflow-hidden text-left">
          {/* Background alert glow */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-red-500/10 blur-3xl animate-pulse" />
          
          <div className="flex items-center gap-4 border-b border-red-500/20 pb-5">
            <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">Fallo Crítico de Seguridad</h1>
              <p className="text-xs text-red-400 mt-0.5 font-semibold">Service Role Key expuesta en el cliente</p>
            </div>
          </div>

          <div className="text-sm leading-relaxed text-slate-355 flex flex-col gap-4 font-light">
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold">{errorMessage}</p>
            </div>

            <p>
              Supabase proporciona dos tipos de claves de API principales:
            </p>
            <ul className="list-disc list-inside pl-2 flex flex-col gap-2.5">
              <li>
                <span className="font-semibold text-white font-mono">anon</span> (Apropiada para cliente): Respeta estrictamente las políticas de seguridad a nivel de fila (RLS).
              </li>
              <li>
                <span className="font-semibold text-red-400 font-mono">service_role</span> (Solo servidor): Evita la seguridad RLS por completo. **Exponer esta clave expone toda tu base de datos a lectura, escritura y borrado libre por cualquier usuario.**
              </li>
            </ul>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col gap-2 mt-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="h-4 w-4" /> Solución Sugerida
              </span>
              <p className="text-2xs text-slate-400 leading-relaxed mt-1 font-mono">
                1. Abre tu archivo <code className="text-white">.env.local</code> en el directorio raíz.<br />
                2. Reemplaza el valor de <code className="text-red-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> con tu clave pública anon (la clave que empieza con <code className="text-white">eyJ...</code> y tiene rol anon).<br />
                3. Reinicia tu servidor de desarrollo con <code className="text-white">npm run dev</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
