"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { shouldUseSupabase } from "@/lib/storageClient";
import { Lock, Key, ArrowLeft, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTier(searchParams.get("tier"));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const selectedTier = tier;

    // Check if we are running in local/demo mode (without Supabase database)
    if (!shouldUseSupabase()) {
      // Set mock authentication cookies and localStorage
      document.cookie = "sb-mock-auth-token=true; path=/";
      document.cookie = "demo_mode=true; path=/";
      localStorage.setItem("demo_mode", "true");

      if (selectedTier === "starter" || selectedTier === "pro") {
        // Also update tier in sandbox profile if exists
        const profData = localStorage.getItem("sandbox_profile");
        if (profData) {
          try {
            const prof = JSON.parse(profData);
            prof.tier = selectedTier;
            localStorage.setItem("sandbox_profile", JSON.stringify(prof));
          } catch {}
        }
        router.push(`/plans?tier=${selectedTier}`);
      } else {
        router.push("/dashboard");
      }
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Check if profile exists
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", data.user.id)
          .single();

        if (profile && profile.full_name) {
          if (selectedTier === "starter" || selectedTier === "pro") {
            router.push(`/plans?tier=${selectedTier}`);
          } else {
            router.push("/dashboard");
          }
        } else {
          // Redirect to onboarding if profile is incomplete
          router.push(selectedTier ? `/onboarding?tier=${selectedTier}` : "/onboarding");
        }
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Error al iniciar sesión.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-24 text-center flex-grow flex items-center justify-center min-h-[80vh]">
      <div className="glass rounded-3xl p-8 flex flex-col gap-6 w-full text-left border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        {/* Back light glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Iniciar Sesión</h1>
            <p className="text-xs text-slate-400 mt-0.5">Ingresa a tu cuenta de Freelancer Tracker</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Contraseña</label>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 pl-4 pr-10 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white transition-all"
              />
              <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                Ingresar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex flex-col gap-3 text-center border-t border-slate-100 dark:border-slate-850 pt-4">
          <p className="text-2xs text-slate-450">
            ¿No tienes cuenta?{" "}
            <Link href={tier ? `/register?tier=${tier}` : "/register"} className="font-bold text-indigo-500 hover:underline">
              Regístrate aquí
            </Link>
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1 text-2xs font-semibold text-slate-400 hover:text-slate-650 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
