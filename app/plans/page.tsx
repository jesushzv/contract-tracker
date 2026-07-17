"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, ShieldCheck, Zap, Activity, Sparkles, Loader2 } from "lucide-react";
import { getProfile, updateProfile, isDemoMode, shouldUseSupabase } from "@/lib/storageClient";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";

export default function PlansPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const selectTier = async (tier: "free" | "starter" | "pro", currentProfile: Profile | null, currentIsDemo: boolean) => {
    if (shouldUseSupabase() && !currentIsDemo) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        localStorage.setItem("selected_signup_tier", tier);
        document.cookie = `selected_signup_tier=${tier}; path=/; max-age=3600`;
        router.push(`/register?tier=${tier}`);
        return;
      }
    }

    if (currentIsDemo) {
      // Direct local storage transition in Demo Mode
      const currentProf = currentProfile || {
        id: "demo-freelancer-uuid",
        email: "hector@freelancemx.dev",
        fullName: "Héctor J. Guerrero",
        bankDetails: { clabe: "", bankName: "", beneficiaryName: "" },
      };
      const updated = { ...currentProf, tier };
      await updateProfile(updated);
      router.push("/onboarding");
      return;
    }

    if (tier === "free") {
      if (currentProfile) {
        await updateProfile({ ...currentProfile, tier: "free" });
      }
      router.push("/onboarding");
      return;
    }

    // If user already has an active subscription, direct them to the billing portal to upgrade/manage
    if (currentProfile?.stripeSubscriptionId) {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
        return;
      } else {
        throw new Error(data.error || "Fallo al abrir el portal de facturación");
      }
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
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const prof = await getProfile();
        setProfile(prof);
        const demo = isDemoMode();
        setIsDemo(demo);

        // Check if a specific tier was passed in the URL to auto-select/subscribe
        const searchParams = new URLSearchParams(window.location.search);
        const urlTier = searchParams.get("tier") as "free" | "starter" | "pro" | null;
        if (urlTier && (urlTier === "free" || urlTier === "starter" || urlTier === "pro")) {
          setLoading(urlTier);
          try {
            await selectTier(urlTier, prof, demo);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Error al procesar suscripción: ${msg}`);
          } finally {
            setLoading(null);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectTier = async (tier: "free" | "starter" | "pro") => {
    setLoading(tier);
    try {
      await selectTier(tier, profile, isDemo);
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
    <div className="relative isolate overflow-hidden flex flex-col flex-grow py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-500 to-[#10b981] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-base font-semibold leading-7 text-indigo-600 uppercase tracking-widest">Planes y Precios</h2>
        <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Elige el plan ideal para tu negocio freelance
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-slate-600">
          Digitaliza tus contratos, protege tus cobros con la LFT mexicana y simplifica tus conciliaciones bancarias.
        </p>

        {isDemo && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 border border-amber-200 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
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
            ? "p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100"
            : plan.accent === "purple"
              ? "p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100"
              : "p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100";

          const checkClasses = plan.accent === "emerald"
            ? "h-5 w-5 shrink-0 text-emerald-500 mt-0.5"
            : plan.accent === "purple"
              ? "h-5 w-5 shrink-0 text-purple-500 mt-0.5"
              : "h-5 w-5 shrink-0 text-indigo-500 mt-0.5";

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl p-8 shadow-xl ring-1 ring-slate-200 bg-white ${
                isStarter
                  ? "ring-2 ring-emerald-500 shadow-emerald-500/10 transform md:-translate-y-4"
                  : ""
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-4 right-8 inline-flex items-center rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold text-emerald-700 uppercase tracking-wide ring-1 ring-inset ring-emerald-600/20 shadow-sm">
                  {plan.badge}
                </span>
              )}
              
              <div>
                <div className="flex items-center gap-x-4">
                  <div className={iconClasses}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold leading-8 text-slate-900">
                    {plan.name}
                  </h3>
                </div>
                
                <p className="mt-6 text-sm leading-6 text-slate-600 min-h-[48px]">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-x-2">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-slate-500">
                    {plan.period}
                  </span>
                </div>

                <ul className="mt-8 space-y-4 text-sm leading-6 text-slate-600">
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
                  className={`w-full rounded-xl py-3.5 px-4 text-center text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    isStarter
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                      : isPro
                        ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-600/20"
                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10"
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
