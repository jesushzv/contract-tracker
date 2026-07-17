"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { shouldUseSupabase } from "@/lib/storageClient";
import { UserPlus, ArrowLeft, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, Check, X } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlTier = searchParams.get("tier");
    if (urlTier) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTier(urlTier);
      localStorage.setItem("selected_signup_tier", urlTier);
      document.cookie = `selected_signup_tier=${urlTier}; path=/; max-age=3600`;
    }
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

    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setError("La contraseña debe cumplir con todos los requisitos de seguridad.");
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

    // Clear any leftover demo mode flags to ensure a clean real registration
    localStorage.removeItem("demo_mode");
    document.cookie = "demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
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
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-24 text-center flex-grow flex items-center justify-center min-h-[80vh]">
      <div className="glass rounded-3xl p-6 sm:p-8 flex flex-col gap-6 w-full text-left border border-indigo-500/20 shadow-2xl relative overflow-hidden">
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
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-6 text-center flex flex-col gap-4 items-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 animate-bounce">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">¡Registro Exitoso!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {successMessage}
              </p>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800/60 w-full pt-4 mt-2">
              <p className="text-xs text-slate-500 leading-normal">
                ¿No recibiste el correo? Revisa tu bandeja de spam o promociones.
              </p>
              <button 
                type="button"
                onClick={() => alert("Enlace de confirmación reenviado (Simulado)")}
                className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors focus:outline-none"
              >
                Reenviar correo de confirmación
              </button>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Contraseña (Mínimo 8 caracteres)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/40 pl-4 pr-10 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password strength checklist */}
              {password.length > 0 && (
                <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3 border border-slate-200 dark:border-slate-800 text-xs flex flex-col gap-1.5 text-left">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">Requisitos de Seguridad:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <span className={`flex items-center gap-1 font-medium ${password.length >= 8 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>
                      {password.length >= 8 ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                      Mínimo 8 caracteres
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${/[A-Z]/.test(password) ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>
                      {/[A-Z]/.test(password) ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                      1 Mayúscula
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${/[a-z]/.test(password) ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>
                      {/[a-z]/.test(password) ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                      1 Minúscula
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${/[0-9]/.test(password) ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>
                      {/[0-9]/.test(password) ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                      1 Número
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${/[^A-Za-z0-9]/.test(password) ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>
                      {/[^A-Za-z0-9]/.test(password) ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <X className="h-3.5 w-3.5 flex-shrink-0" />}
                      1 Carácter Especial
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Confirmar Contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/40 pl-4 pr-10 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-70 mt-2"
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

        <div className="flex flex-col gap-4 text-center border-t border-slate-200 dark:border-slate-800 pt-5 mt-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href={tier ? `/login?tier=${tier}` : "/login"} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
