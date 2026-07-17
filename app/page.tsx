"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Landmark, 
  Smartphone,
  TrendingUp,
  Clock,
  HelpCircle,
  Calculator,
  ChevronDown
} from "lucide-react";

export default function Home() {
  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      const cookies = document.cookie.split(";");
      const hasCookie = cookies.some((c) => {
        const trimmed = c.trim();
        if (trimmed.startsWith("sb-") && trimmed.includes("-auth-token=")) {
          const valueStr = trimmed.substring(trimmed.indexOf("=") + 1);
          try {
            const decoded = decodeURIComponent(valueStr);
            const val = JSON.parse(decoded);
            if (val === true || val === "true") return true;
            if (val && typeof val === "object" && val.access_token) return true;
          } catch {
            if (valueStr === "true") return true;
          }
        }
        return false;
      });
      const hasDemoMode = localStorage.getItem("demo_mode") === "true";
      setIsLoggedIn(hasCookie || hasDemoMode);
    };
    checkSession();
  }, []);

  // ROI Calculator states
  const [projectRate, setProjectRate] = useState(25000);
  const [projectCount, setProjectCount] = useState(10);
  const [delayDays, setDelayDays] = useState(18);

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Calculations
  const totalYearlyRevenue = projectRate * projectCount;
  const yearlyDaysDelayed = projectCount * delayDays;
  const liquidityAtRisk = Math.round((totalYearlyRevenue / 365) * delayDays);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "¿Qué validez legal tiene en México la aceptación digital?",
      a: "Totalmente vinculante. Bajo el artículo 89 del Código de Comercio de México, los contratos electrónicos firmados mediante firma digital simple (clickwrap con aceptación de términos, registro de dirección IP y marca de tiempo) tienen plena validez legal y son admisibles ante tribunales civiles y comerciales."
    },
    {
      q: "¿Cómo ayuda a evitar demandas por subordinación laboral?",
      a: "Nuestros contratos integran cláusulas específicas que documentan la autonomía del freelancer (ausencia de horario fijo, uso de herramientas propias y carácter estrictamente mercantil del servicio), desvirtuando los elementos de una relación de trabajo subordinada regulada por la Ley Federal del Trabajo (LFT)."
    },
    {
      q: "¿Necesito conectar mis contraseñas bancarias al tracker?",
      a: "¡No! Diseñamos esto con seguridad de primer nivel. Tú solo ingresas tu CLABE Interbancaria de manera estática. Tu cliente te transfiere directamente por SPEI desde su app de banco habitual y nos reporta la 'Clave de Rastreo' que verificamos en el portal Banxico CEP sin comprometer tus cuentas."
    },
    {
      q: "¿Cómo funciona el envío del contrato por WhatsApp?",
      a: "Una vez que redactas el contrato en el sistema, generamos un enlace único. Puedes hacer click en 'Enviar por WhatsApp' y automáticamente creamos un mensaje personalizado con el link de la propuesta para tu cliente. El cliente lo abre directamente en el navegador de su teléfono sin tener que descargar ninguna app."
    }
  ];

  return (
    <div className="relative isolate overflow-hidden flex flex-col flex-grow">
      {/* Background gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-500 to-[#10b981] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 flex-grow flex flex-col gap-24">
        
        {/* HERO SECTION */}
        <div className="mx-auto max-w-2xl text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-600 mb-8 border border-indigo-500/20 pulse-subtle">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Simplifica tu freelance en México</span>
          </div>

          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl leading-tight">
            Contratos Rápidos y{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent ">
              Anticipos Seguros
            </span>
          </h1>
          
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl">
            Crea propuestas con plantillas legales de México (Honorarios, no subordinación laboral LFT), firma de aceptación express por WhatsApp y controla el estado de tus cobros en una sola herramienta.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-y-4 w-full sm:w-auto">
            <div className="flex items-center justify-center gap-x-6 w-full sm:w-auto flex-col sm:flex-row gap-y-4">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 dark:bg-indigo-400 transition-all duration-200 group"
                >
                  Ir a mi Panel
                  <ArrowRight className="ml-2.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 dark:bg-indigo-400 transition-all duration-200 group"
                  >
                    Comenzar a Crear
                    <ArrowRight className="ml-2.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/dashboard?demo=true"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all duration-200"
                  >
                    Probar Demo con Datos
                  </Link>
                </>
              )}
            </div>
            {!isLoggedIn && (
              <p className="text-sm text-slate-500 mt-2">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
                  Inicia sesión aquí
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* FEATURE GRID */}
        <div className="mx-auto max-w-5xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-8 sm:max-w-none sm:grid-cols-3">
            
            <div className="glass glass-interactive rounded-2xl p-6 flex flex-col text-left">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                  <FileText className="h-5 w-5" />
                </div>
                Cláusulas de Ley (MX)
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-sm leading-relaxed text-slate-500">
                <p className="flex-auto">
                  Evita demandas de subordinación laboral. Plantillas optimizadas para el régimen simplificado de confianza (RESICO) y servicios profesionales de honorarios en México.
                </p>
              </dd>
            </div>

            <div className="glass glass-interactive rounded-2xl p-6 flex flex-col text-left">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Smartphone className="h-5 w-5" />
                </div>
                Aceptación por WhatsApp
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-sm leading-relaxed text-slate-500">
                <p className="flex-auto">
                  Tu cliente abre el link en su móvil, revisa los hitos y acepta con un click. Guardamos nombre, timestamp e IP como registro probatorio y te notificamos al instante.
                </p>
              </dd>
            </div>

            <div className="glass glass-interactive rounded-2xl p-6 flex flex-col text-left">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                  <Landmark className="h-5 w-5" />
                </div>
                Seguimiento de Anticipos
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-sm leading-relaxed text-slate-500">
                <p className="flex-auto">
                  Configura montos (ej. 50% anticipo, 50% finiquito). El cliente visualiza tu CLABE de SPEI, ingresa su Clave de Rastreo bancaria y confirmas en tu dashboard.
                </p>
              </dd>
            </div>

          </dl>
        </div>

        {/* INTERACTIVE ROI CALCULATOR */}
        <div className="mx-auto max-w-4xl w-full text-left">
          <div className="glass rounded-3xl p-6 md:p-8 border-indigo-500/10 flex flex-col md:flex-row gap-8 items-center">
            
            <div className="flex-1 flex flex-col gap-5">
              <div className="flex items-center gap-2 text-indigo-500">
                <Calculator className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Calculadora de Impacto Financiero</span>
              </div>
              <h3 className="font-heading text-2xl font-extrabold text-slate-900">
                ¿Cuánto te cuesta la cobranza informal?
              </h3>
              <p className="text-xs leading-relaxed text-slate-500">
                Chasing client payments over WhatsApp without formal, milestone-backed clickwrap agreements delays cash flow and hurts your monthly liquidity. Measure the cost below:
              </p>

              <div className="flex flex-col gap-4 mt-2">
                <div>
                  <div className="flex justify-between text-2xs font-semibold text-slate-500 uppercase mb-2">
                    <span>Cobro promedio por Proyecto</span>
                    <span className="text-indigo-500 font-bold">${projectRate.toLocaleString("es-MX")} MXN</span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={150000}
                    step={5000}
                    value={projectRate}
                    onChange={(e) => setProjectRate(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 "
                  />
                </div>

                <div>
                  <div className="flex justify-between text-2xs font-semibold text-slate-500 uppercase mb-2">
                    <span>Proyectos al Año</span>
                    <span className="text-indigo-500 font-bold">{projectCount} proyectos</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={40}
                    step={1}
                    value={projectCount}
                    onChange={(e) => setProjectCount(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 "
                  />
                </div>

                <div>
                  <div className="flex justify-between text-2xs font-semibold text-slate-500 uppercase mb-2">
                    <span>Días promedio de retraso en pago</span>
                    <span className="text-indigo-500 font-bold">{delayDays} días</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={60}
                    step={1}
                    value={delayDays}
                    onChange={(e) => setDelayDays(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 "
                  />
                </div>
              </div>
            </div>

            <div className="w-full md:w-80 rounded-2xl bg-indigo-900/10 /5 p-6 border border-indigo-500/20 flex flex-col gap-6">
              <div>
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">Ingresos anuales estimados</span>
                <span className="text-xl font-bold text-slate-800">{formatMoney(totalYearlyRevenue)}</span>
              </div>

              <div className="border-t border-slate-200 /80 pt-4">
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-500" />
                  Días de demora acumulados
                </span>
                <span className="text-2xl font-black text-amber-600 ">{yearlyDaysDelayed} días/año</span>
                <p className="text-4xs text-slate-400 mt-1">Tiempo que pasas persiguiendo transferencias bancarias.</p>
              </div>

              <div className="border-t border-slate-200 /80 pt-4">
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-indigo-500" />
                  Liquidez atorada en cartera
                </span>
                <span className="text-xl font-black text-indigo-600 ">{formatMoney(liquidityAtRisk)}</span>
                <p className="text-4xs text-slate-400 mt-1">Capital de trabajo atrapado por la falta de un flujo de cobranza digital.</p>
              </div>
            </div>

          </div>
        </div>

        {/* PRICING PLANS */}
        <div className="mx-auto max-w-4xl w-full text-center flex flex-col gap-8">
          <div>
            <h3 className="font-heading text-2xl font-extrabold tracking-tight text-slate-900">Planes Justos para Freelancers</h3>
            <p className="text-sm text-slate-500 mt-1">
              Comienza gratis hoy mismo. Actualiza para desbloquear automatizaciones y cobros recurrentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
            {/* Free tier */}
            <div className="glass rounded-3xl p-6 flex flex-col justify-between text-left border-slate-200 bg-white/10">
              <div>
                <h4 className="font-heading text-lg font-bold text-slate-900">Plan Semilla</h4>
                <p className="text-2xs text-slate-400 mt-1">Ideal para iniciar en el freelance con orden.</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">$0</span>
                  <span className="text-xs text-slate-400 ml-1">Gratis de por vida</span>
                </div>
                <ul className="mt-6 flex flex-col gap-3 text-xs text-slate-500">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Hasta 3 contratos creados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Aceptación por clickwrap express
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Plantillas de contrato básicas (MXN)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Generador de links de WhatsApp
                  </li>
                </ul>
              </div>
              <Link 
                href="/register?tier=free"
                className="mt-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-center py-2.5 text-xs font-bold transition-colors cursor-pointer shadow-md"
              >
                Comenzar Gratis
              </Link>
            </div>

            {/* Starter tier */}
            <div className="glass rounded-3xl p-6 flex flex-col justify-between text-left border-indigo-500/35 relative overflow-hidden bg-indigo-500/5">
              <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                Popular
              </div>
              <div>
                <h4 className="font-heading text-lg font-bold text-indigo-500">Plan Emprendedor</h4>
                <p className="text-2xs text-slate-400 mt-1">Para profesionales con flujo de clientes constante.</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">$99</span>
                  <span className="text-xs text-slate-400 ml-1">MXN / mes</span>
                </div>
                <ul className="mt-6 flex flex-col gap-3 text-xs text-slate-500">
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    <strong>Hasta 10 contratos activos</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    Monedas múltiples (MXN & USD)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    Personalización de logotipos y firmas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    Soporte prioritario
                  </li>
                </ul>
              </div>
              <Link 
                href="/register?tier=starter"
                className="mt-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-center py-2.5 text-xs font-bold shadow-lg shadow-indigo-600/15 transition-colors cursor-pointer"
              >
                Suscribirse a Starter
              </Link>
            </div>

            {/* Pro tier */}
            <div className="glass rounded-3xl p-6 flex flex-col justify-between text-left border-purple-500/35 relative overflow-hidden bg-purple-500/5">
              <div>
                <h4 className="font-heading text-lg font-bold text-purple-500">Plan Profesional</h4>
                <p className="text-2xs text-slate-400 mt-1">Control absoluto, automatización y conciliación.</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">$199</span>
                  <span className="text-xs text-slate-400 ml-1">MXN / mes</span>
                </div>
                <ul className="mt-6 flex flex-col gap-3 text-xs text-slate-500">
                  <li className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <strong>Contratos e hitos ilimitados</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    Reconciliación SPEI automática (CEP)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    Multi-perfiles de pago bancarios
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    Control de versiones e historial
                  </li>
                </ul>
              </div>
              <Link 
                href="/register?tier=pro"
                className="mt-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-center py-2.5 text-xs font-bold shadow-lg shadow-purple-600/15 transition-colors cursor-pointer"
              >
                Suscribirse a Pro
              </Link>
            </div>
          </div>
        </div>

        {/* LEGAL VULNERABILITIES & FAQ ACCORDION */}
        <div className="mx-auto max-w-3xl w-full text-left">
          <div className="flex items-center gap-2 text-indigo-500 justify-center mb-6">
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Preguntas Frecuentes y Respaldo Legal</span>
          </div>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="glass rounded-2xl p-4 transition-all duration-300 border-slate-100 cursor-pointer"
                  onClick={() => toggleFaq(index)}
                >
                  <div className="flex items-center justify-between gap-4 font-bold text-sm text-slate-800">
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-indigo-500" : ""
                    }`} />
                  </div>
                  {isOpen && (
                    <div className="mt-3 text-xs leading-relaxed text-slate-500 font-light border-t border-slate-100 pt-3 animate-in slide-in-from-top-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action card */}
        <div className="mx-auto max-w-4xl w-full rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-950 p-8 text-white shadow-xl relative overflow-hidden text-left">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <ShieldCheck className="h-96 w-96" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-lg">
              <h3 className="font-heading text-xl font-bold">Protege tu trabajo de manera formal</h3>
              <p className="mt-2 text-xs text-slate-350 leading-relaxed font-light">
                Comienza a cobrar tus proyectos con el esquema de anticipos y validez legal que necesitas. Deja atrás los cobros informales por WhatsApp.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            >
              Crear mi Primer Contrato
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer background gradients */}
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-emerald-400 to-indigo-500 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
      </div>
    </div>
  );
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};
