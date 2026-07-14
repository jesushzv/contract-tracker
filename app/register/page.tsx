"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { shouldUseSupabase } from "@/lib/storageClient";
import { UserPlus, Key, ArrowLeft, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTier(searchParams.get("tier"));
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    const selectedTier = tier || "free";

    // Check if we are running in local/demo mode (without Supabase database)
    if (!shouldUseSupabase()) {
      // Simulate registration success
      setSuccess(true);
      setSuccessMessage("¡Registro exitoso (Modo Demo)! Redirigiéndote...");
      
      // Set mock authentication cookies and localStorage
      document.cookie = "sb-mock-auth-token=true; path=/";
      document.cookie = "demo_mode=true; path=/";
      localStorage.setItem("demo_mode", "true");

      const defaultProfile = {
        id: "demo-freelancer-uuid",
        email,
        fullName: "",
        tier: selectedTier,
        bankDetails: { clabe: "", bankName: "", beneficiaryName: "" },
      };
      localStorage.setItem("sandbox_profile", JSON.stringify(defaultProfile));

      setTimeout(() => {
        if (selectedTier === "starter" || selectedTier === "pro") {
          router.push(`/plans?tier=${selectedTier}`);
        } else {
          router.push("/onboarding");
        }
      }, 2000);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding${selectedTier ? `?tier=${selectedTier}` : ""}`,
        }
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
        if (data.session) {
          setSuccessMessage("¡Registro exitoso! Redirigiéndote...");
          setTimeout(() => {
            if (selectedTier === "starter" || selectedTier === "pro") {
              router.push(`/plans?tier=${selectedTier}`);
            } else {
              router.push("/onboarding");
            }
          }, 2000);
        } else {
          setSuccessMessage("¡Registro exitoso! Por favor, verifica tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.");
          setLoading(false);
        }
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Error al registrarse.");
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
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Crear Cuenta</h1>
            <p className="text-xs text-slate-400 mt-0.5">Regístrate para gestionar tus contratos</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-650 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-800 dark:text-emerald-400">
            <p className="font-bold">{successMessage}</p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
              <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Contraseña (Mínimo 6 caracteres)</label>
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

            <div className="flex flex-col gap-1.5">
              <label className="text-3xs font-semibold text-slate-455 dark:text-slate-400 uppercase tracking-wider">Confirmar Contraseña</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Registrando...
                </>
              ) : (
                <>
                  Registrarse
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="flex flex-col gap-3 text-center border-t border-slate-100 dark:border-slate-850 pt-4">
          <p className="text-2xs text-slate-450">
            ¿Ya tienes una cuenta?{" "}
            <Link href={tier ? `/login?tier=${tier}` : "/login"} className="font-bold text-indigo-500 hover:underline">
              Inicia sesión aquí
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
