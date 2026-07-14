"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, ShieldCheck, Zap, Activity, Sparkles, Loader2 } from "lucide-react";
import { getProfile, updateProfile, isDemoMode } from "@/lib/storageClient";
import { Profile } from "@/lib/types";

export default function PlansPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const prof = await getProfile();
        setProfile(prof);
        setIsDemo(isDemoMode());
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    }
    loadProfile();
  }, []);

  const handleSelectTier = async (tier: "free" | "starter" | "pro") => {
    setLoading(tier);
    try {
      if (isDemo) {
        // Direct local storage transition in Demo Mode
        const currentProfile = profile || {
          id: "demo-freelancer-uuid",
          email: "hector@freelancemx.dev",
          fullName: "Héctor J. Guerrero",
          bankDetails: { clabe: "", bankName: "", beneficiaryName: "" },
        };
        const updated = { ...currentProfile, tier };
        await updateProfile(updated);
        router.push("/onboarding");
        return;
      }

      if (tier === "free") {
        if (profile) {
          await updateProfile({ ...profile, tier: "free" });
        }
        router.push("/onboarding");
        return;
      }

      // Production redirect to Stripe Checkout
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        throw new Error(data.error || "Fallo al crear sesión de pago");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Error al procesar suscripción: ${msg}`);
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: "free",
      name: "Plan Gratuito",
      price: "$0",
      period: "para siempre",
      description: "Ideal para freelancers que inician y quieren digitalizar sus primeros contratos.",
      features: [
        "Hasta 3 contratos creados",
        "Aceptación digital por WhatsApp/OTP",
        "Plantillas de contrato en pesos (MXN)",
        "Doble aceptación (Freelancer & Cliente)",
        "Soporte comunitario",
      ],
      icon: Activity,
      buttonText: "Continuar Gratis",
      accent: "indigo",
    },
    {
      id: "starter",
      name: "Plan Emprendedor",
      price: "$99",
      period: "MXN / mes",
      description: "Para freelancers establecidos con múltiples clientes recurrentes en México.",
      features: [
        "Hasta 10 contratos activos",
        "Aceptación digital ilimitada",
        "Monedas múltiples (MXN & USD)",
        "Carga de firmas y logos personalizados",
        "Soporte prioritario",
        "Estadísticas de facturación básicas",
      ],
      icon: Zap,
      buttonText: "Suscribirse a Starter",
      accent: "emerald",
      badge: "Más popular",
    },
    {
      id: "pro",
      name: "Plan Profesional",
      price: "$199",
      period: "MXN / mes",
      description: "Control absoluto, contratos ilimitados y optimización fiscal avanzada.",
      features: [
        "Contratos ilimitados",
        "Aceptación digital ilimitada",
        "Reconciliación de pagos SPEI automatizada",
        "Multi-perfiles de pago (diferentes bancos/CLABEs)",
        "Historial y control de versiones de contratos",
        "Cláusulas legales premium (RESICO / LFT)",
        "Notificaciones en tiempo real",
      ],
      icon: Sparkles,
      buttonText: "Suscribirse a Pro",
      accent: "purple",
    },
  ];

  return (
    <div className="relative isolate overflow-hidden flex flex-col flex-grow py-12 px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-500 to-[#10b981] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Planes y Precios</h2>
        <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Elige el plan ideal para tu negocio freelance
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-slate-600 dark:text-slate-350">
          Digitaliza tus contratos, protege tus cobros con la LFT mexicana y simplifica tus conciliaciones bancarias.
        </p>

        {isDemo && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <ShieldCheck className="h-4 w-4" />
            <span><strong>Modo Demo Activo:</strong> Puedes seleccionar Starter o Pro sin costo real (se activarán de inmediato localmente).</span>
          </div>
        )}
      </div>

      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 lg:max-w-5xl lg:grid-cols-3 lg:gap-x-8">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isStarter = plan.id === "starter";
          const isPro = plan.id === "pro";
          
          const iconClasses = plan.accent === "emerald"
            ? "p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15"
            : plan.accent === "purple"
              ? "p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/15"
              : "p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15";

          const checkClasses = plan.accent === "emerald"
            ? "h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5"
            : plan.accent === "purple"
              ? "h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5"
              : "h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5";

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl p-8 shadow-xl ring-1 ring-slate-200/80 dark:ring-slate-800/80 backdrop-blur-xl ${
                isStarter
                  ? "bg-slate-50/70 dark:bg-slate-900/60 ring-2 ring-emerald-500/50 dark:ring-emerald-500/40"
                  : "bg-white/40 dark:bg-slate-900/30"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 right-6 inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
                  {plan.badge}
                </span>
              )}
              
              <div>
                <div className="flex items-center gap-x-3">
                  <div className={iconClasses}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold leading-8 text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                </div>
                
                <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400 min-h-[48px]">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                    {plan.period}
                  </span>
                </div>

                <ul className="mt-8 space-y-3.5 text-sm leading-6 text-slate-600 dark:text-slate-350">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3 items-start">
                      <Check className={checkClasses} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => handleSelectTier(plan.id as "free" | "starter" | "pro")}
                  disabled={loading !== null}
                  className={`w-full rounded-xl py-3 px-4 text-center text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    isStarter
                      ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                      : isPro
                        ? "bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/20"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 shadow-md shadow-indigo-600/10"
                  }`}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      {plan.buttonText}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
