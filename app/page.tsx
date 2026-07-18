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
  ChevronDown,
  PlayCircle,
  MessageCircle,
  Check,
  Star
} from "lucide-react";

export default function Home() {
  // Check if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Enable smooth scrolling for anchor links
    document.documentElement.style.scrollBehavior = "smooth";
    
    // Clear demo mode if we land on the homepage
    localStorage.removeItem("demo_mode");
    sessionStorage.removeItem("demo_mode");
    document.cookie = "demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "sb-mock-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

    const checkSession = () => {
      const cookies = document.cookie.split(";");
      const hasCookie = cookies.some((c) => {
        const trimmed = c.trim();
        // Since we clear demo_mode cookie above, this will now only be true for real sessions
        if (trimmed === "demo_mode=true") return true;
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
      setIsLoggedIn(hasCookie);
    };
    checkSession();
    
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
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
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-purple-500 to-[#00ACC1] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 flex-grow flex flex-col gap-24">
        
        {/* HERO SECTION */}
        <div className="mx-auto max-w-4xl text-center flex flex-col items-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-600 mb-8 border border-purple-500/20 pulse-subtle">
            <Sparkles className="h-3.5 w-3.5" />
            <span>El estándar para freelancers en México</span>
          </div>

          <h1 className="font-heading text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl leading-tight">
            Contratos Rápidos y{" "}
            <span className="bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent ">
              Anticipos Seguros
            </span>
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-600 max-w-2xl">
            Crea propuestas con plantillas legales (RESICO / Honorarios), firma de aceptación express por WhatsApp y controla el estado de tus cobros SPEI en una sola plataforma.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-y-4 w-full sm:w-auto">
            <div className="flex items-center justify-center gap-x-6 w-full sm:w-auto flex-col sm:flex-row gap-y-4">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 dark:bg-purple-400 transition-all duration-200 group"
                >
                  Ir a mi Panel
                  <ArrowRight className="ml-2.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 dark:bg-purple-400 transition-all duration-200 group"
                  >
                    Comenzar Gratis
                    <ArrowRight className="ml-2.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/dashboard?demo=true"
                    onClick={() => {
                      localStorage.removeItem("sandbox_profile");
                      localStorage.removeItem("sandbox_contracts");
                      localStorage.removeItem("sandbox_milestones");
                      localStorage.removeItem("sandbox_audit_logs");
                      localStorage.removeItem("sandbox_contract_versions");
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 py-4 text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all duration-200 group"
                  >
                    <PlayCircle className="mr-2.5 h-5 w-5 text-purple-500 transition-transform group-hover:scale-110" />
                    Probar Demo
                  </Link>
                </>
              )}
            </div>
            {!isLoggedIn && (
              <p className="text-sm text-slate-500 mt-4 font-medium">
                Sin tarjeta de crédito. Configura en 2 minutos.
              </p>
            )}
            
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-6 opacity-80">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-100/50 px-3 py-1.5 rounded-full border border-slate-200/50">
                <ShieldCheck className="h-4 w-4 text-cyan-500" />
                Válido ante Código de Comercio (Art. 89)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-100/50 px-3 py-1.5 rounded-full border border-slate-200/50">
                <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                No Subordinación Laboral (LFT)
              </div>
            </div>
          </div>
        </div>

        {/* HERO MOCKUP VISUALIZATION */}
        <div className="mx-auto max-w-5xl w-full -mt-8 relative z-0 perspective-1000">
          <div className="relative rounded-2xl bg-slate-900/5 p-2 md:p-4 ring-1 ring-inset ring-slate-900/10 shadow-2xl backdrop-blur-sm transform rotate-x-2 hover:rotate-x-0 transition-transform duration-700 overflow-hidden">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col h-[500px]">
              {/* Fake browser header */}
              <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                </div>
                <div className="mx-auto bg-white rounded-md border border-slate-200 text-3xs text-slate-400 px-24 py-1 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-cyan-500" />
                  app.mipacto.app/dashboard
                </div>
              </div>
              {/* Fake dashboard UI */}
              <div className="flex-1 bg-slate-50 flex">
                <div className="w-48 border-r border-slate-200 bg-white p-4 hidden md:flex flex-col gap-4">
                  <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-8 bg-purple-50 rounded-lg border border-purple-100 flex items-center px-3">
                    <div className="h-3 w-20 bg-purple-200 rounded"></div>
                  </div>
                  <div className="h-8 bg-slate-50 rounded-lg flex items-center px-3">
                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-8 bg-slate-50 rounded-lg flex items-center px-3">
                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                  </div>
                </div>
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="h-5 w-40 bg-slate-800 rounded mb-2"></div>
                      <div className="h-3 w-64 bg-slate-400 rounded"></div>
                    </div>
                    <div className="h-10 w-32 bg-purple-600 rounded-lg"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                      <div className="h-3 w-20 bg-slate-300 rounded"></div>
                      <div className="h-6 w-32 bg-cyan-500 rounded"></div>
                    </div>
                    <div className="h-24 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                      <div className="h-3 w-24 bg-slate-300 rounded"></div>
                      <div className="h-6 w-28 bg-slate-800 rounded"></div>
                    </div>
                    <div className="h-24 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                      <div className="h-3 w-16 bg-slate-300 rounded"></div>
                      <div className="h-6 w-24 bg-purple-600 rounded"></div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                     <div className="h-4 w-32 bg-slate-800 rounded mb-6"></div>
                     <div className="space-y-4">
                       <div className="h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center px-4 justify-between">
                         <div className="flex items-center gap-3"><div className="h-8 w-8 bg-purple-100 rounded-full"></div><div className="h-3 w-32 bg-slate-400 rounded"></div></div>
                         <div className="h-5 w-20 bg-amber-100 rounded-full border border-amber-200"></div>
                       </div>
                       <div className="h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center px-4 justify-between">
                         <div className="flex items-center gap-3"><div className="h-8 w-8 bg-cyan-100 rounded-full"></div><div className="h-3 w-28 bg-slate-400 rounded"></div></div>
                         <div className="h-5 w-24 bg-cyan-100 rounded-full border border-cyan-200"></div>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TRUST BADGES */}
        <div className="mx-auto max-w-4xl text-center border-y border-slate-200/60 py-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
            Profesionales independientes y agencias lo utilizan para colaborar con:
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-60 grayscale">
             {/* Fake logos represented by text for simplicity */}
             <div className="text-lg font-black font-sans text-slate-800 tracking-tighter">Acme Corp</div>
             <div className="text-xl font-bold font-serif text-slate-800 italic">Globex</div>
             <div className="text-lg font-extrabold font-mono text-slate-800 tracking-widest">SOYUZ</div>
             <div className="text-xl font-bold text-slate-800">Initech</div>
             <div className="text-lg font-medium text-slate-800 uppercase tracking-widest hidden md:block">Massive Dynamic</div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div id="como-funciona" className="mx-auto max-w-5xl text-center scroll-mt-24">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Tu proceso de cobro, automatizado
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            Olvídate de redactar Word, exportar a PDF y esperar semanas por una firma.
          </p>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-purple-100 via-purple-500 to-purple-100 z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-600/30 mb-6 ring-8 ring-white">1</div>
              <h3 className="text-xl font-bold text-slate-900">Configura Hitos</h3>
              <p className="text-sm text-slate-500 mt-2 text-center">
                Define el alcance y divide el pago (ej. 50% anticipo, 50% finiquito). Nuestro sistema redacta el contrato legal automáticamente.
              </p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-600/30 mb-6 ring-8 ring-white">2</div>
              <h3 className="text-xl font-bold text-slate-900">Envía por WhatsApp</h3>
              <p className="text-sm text-slate-500 mt-2 text-center">
                Genera un link seguro. Tu cliente lo abre en su celular y acepta los términos con un clickwrap legal (NOM-151).
              </p>
            </div>
            
            <div className="relative z-10 flex flex-col items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20">
              <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-cyan-500/30 mb-6 ring-8 ring-white">3</div>
              <h3 className="text-xl font-bold text-slate-900">Recibe tu SPEI</h3>
              <p className="text-sm text-slate-500 mt-2 text-center">
                El cliente te transfiere directamente a tu banco. Sube su comprobante CEP y el hito se marca como pagado en tu panel.
              </p>
            </div>
          </div>
        </div>

        {/* DEEP DIVE 1: LEGAL */}
        <div className="mx-auto max-w-6xl mt-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-purple-100 to-cyan-50 rounded-3xl transform rotate-2 z-0"></div>
            <div className="relative z-10 bg-white border border-slate-200 rounded-2xl shadow-xl p-6">
              {/* Fake Contract Doc */}
              <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                 <div className="text-xs font-bold text-slate-400">CONTRATO DE PRESTACIÓN DE SERVICIOS</div>
                 <div className="bg-cyan-100 text-cyan-700 text-2xs font-bold px-2 py-1 rounded-md">VINCULANTE</div>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-full bg-slate-200 rounded"></div>
                <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
                <div className="h-3 w-full bg-slate-200 rounded"></div>
                <div className="h-3 w-4/6 bg-slate-200 rounded"></div>
              </div>
              <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-cyan-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Cláusula de No Subordinación (LFT)</div>
                    <div className="text-xs text-slate-500 mt-1">El Prestador actúa con independencia, herramientas propias y sin horario fijo, desvirtuando relación laboral.</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-cyan-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Validez Código de Comercio (Art. 89)</div>
                    <div className="text-xs text-slate-500 mt-1">La firma electrónica mediante NIP/OTP tiene pleno valor probatorio y obligatoriedad legal.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 w-max text-xs font-semibold text-cyan-600 border border-cyan-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Protección Legal Sólida</span>
            </div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Diseñado específicamente para las leyes mexicanas
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              No uses plantillas gringas genéricas. Nuestros contratos civiles (Código Civil Federal) están redactados para protegerte de demandas por subordinación (Ley Federal del Trabajo), cumplir con retenciones fiscales (RESICO) y garantizar firmas vinculantes (Código de Comercio).
            </p>
            <ul className="space-y-3 mt-2">
              <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <Check className="h-5 w-5 text-purple-500" /> Basado en el Código Civil Federal.
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <Check className="h-5 w-5 text-purple-500" /> Registro de IP y Timestamp de firma electrónica (Art. 89).
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <Check className="h-5 w-5 text-purple-500" /> Huella criptográfica SHA-256 inmutable por documento.
              </li>
            </ul>
          </div>
        </div>

        {/* DEEP DIVE 2: WHATSAPP */}
        <div className="mx-auto max-w-6xl mt-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 w-max text-xs font-semibold text-green-600 border border-green-500/20">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Fricción Cero</span>
            </div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Cierra tratos directo en su celular
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Tus clientes no tienen que crear cuentas ni descargar apps. Envíales un link mágico por WhatsApp; ellos revisan la propuesta en su teléfono, aceptan los términos (clickwrap) y te avisan cuando suben el comprobante SPEI.
            </p>
            <Link href="/register" className="text-purple-600 font-bold hover:text-purple-500 flex items-center gap-1 w-max">
              Ver cómo se ve para tu cliente <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative flex justify-center">
             <div className="absolute inset-0 bg-green-100 rounded-full blur-3xl opacity-50 w-64 h-64 m-auto"></div>
             {/* Fake Mobile Phone */}
             <div className="relative z-10 w-[280px] h-[580px] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-900 shadow-2xl flex flex-col overflow-hidden">
               {/* Mobile Screen */}
               <div className="flex-1 bg-slate-50 flex flex-col">
                  {/* Fake header */}
                  <div className="bg-purple-600 pt-8 pb-4 px-4 text-white">
                    <div className="text-xs opacity-70">Propuesta Comercial</div>
                    <div className="font-bold text-lg mt-1">Desarrollo Web E-commerce</div>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 relative">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-500 mb-2">Hito 1: Anticipo</div>
                      <div className="text-xl font-black text-slate-900">$12,500 MXN</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-500 mb-2">Hito 2: Entrega</div>
                      <div className="text-xl font-black text-slate-900">$12,500 MXN</div>
                    </div>
                    {/* Fake action sheet at bottom */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 text-center">
                       <p className="text-2xs text-slate-500 mb-3">Al aceptar, firmas legalmente este contrato.</p>
                       <div className="bg-purple-600 text-white font-bold py-3 rounded-xl text-sm">
                         Aceptar y Firmar Contrato
                       </div>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* FEATURE GRID (Beneficios) */}
        <div id="beneficios" className="mx-auto max-w-5xl mt-12 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900">
              Todo lo que necesitas para profesionalizar tu servicio
            </h2>
          </div>
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-8 sm:max-w-none sm:grid-cols-3">
            <div className="glass glass-interactive rounded-2xl p-6 flex flex-col text-left">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  <FileText className="h-5 w-5" />
                </div>
                Generador de Plantillas
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-sm leading-relaxed text-slate-500">
                <p className="flex-auto">
                  Responde 4 preguntas y el sistema genera el contrato completo. Adiós a buscar machotes en Google.
                </p>
              </dd>
            </div>

            <div className="glass glass-interactive rounded-2xl p-6 flex flex-col text-left">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
                  <Smartphone className="h-5 w-5" />
                </div>
                Aceptación por WhatsApp
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-sm leading-relaxed text-slate-500">
                <p className="flex-auto">
                  Guarda nombre, timestamp e IP del cliente como registro probatorio y te notifica al instante.
                </p>
              </dd>
            </div>

            <div className="glass glass-interactive rounded-2xl p-6 flex flex-col text-left">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  <Landmark className="h-5 w-5" />
                </div>
                Seguimiento SPEI / CEP
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-sm leading-relaxed text-slate-500">
                <p className="flex-auto">
                  El cliente visualiza tu CLABE, ingresa su comprobante y tú confirmas el pago desde tu celular.
                </p>
              </dd>
            </div>
          </dl>
        </div>

        {/* INTERACTIVE ROI CALCULATOR */}
        <div className="mx-auto max-w-4xl w-full text-left mt-8">
          <div className="glass rounded-3xl p-6 md:p-8 border-purple-500/10 flex flex-col md:flex-row gap-8 items-center">
            
            <div className="flex-1 flex flex-col gap-5">
              <div className="flex items-center gap-2 text-purple-500">
                <Calculator className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Calculadora de Impacto Financiero</span>
              </div>
              <h3 className="font-heading text-2xl font-extrabold text-slate-900">
                ¿Cuánto te cuesta la cobranza informal?
              </h3>
              <p className="text-xs leading-relaxed text-slate-500">
                Perseguir pagos por WhatsApp sin un acuerdo firmado lastima tu flujo de caja. Mide el costo de oportunidad:
              </p>

              <div className="flex flex-col gap-4 mt-2">
                <div>
                  <div className="flex justify-between text-2xs font-semibold text-slate-500 uppercase mb-2">
                    <span>Cobro promedio por Proyecto</span>
                    <span className="text-purple-500 font-bold">${projectRate.toLocaleString("es-MX")} MXN</span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={150000}
                    step={5000}
                    value={projectRate}
                    onChange={(e) => setProjectRate(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 "
                  />
                </div>

                <div>
                  <div className="flex justify-between text-2xs font-semibold text-slate-500 uppercase mb-2">
                    <span>Proyectos al Año</span>
                    <span className="text-purple-500 font-bold">{projectCount} proyectos</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={40}
                    step={1}
                    value={projectCount}
                    onChange={(e) => setProjectCount(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 "
                  />
                </div>

                <div>
                  <div className="flex justify-between text-2xs font-semibold text-slate-500 uppercase mb-2">
                    <span>Días promedio de retraso en pago</span>
                    <span className="text-purple-500 font-bold">{delayDays} días</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={60}
                    step={1}
                    value={delayDays}
                    onChange={(e) => setDelayDays(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 "
                  />
                </div>
              </div>
            </div>

            <div className="w-full md:w-80 rounded-2xl bg-purple-900/10 p-6 border border-purple-500/20 flex flex-col gap-6">
              <div>
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block">Ingresos anuales estimados</span>
                <span className="text-xl font-bold text-slate-800">{formatMoney(totalYearlyRevenue)}</span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-500" />
                  Días de demora acumulados
                </span>
                <span className="text-2xl font-black text-amber-600 ">{yearlyDaysDelayed} días/año</span>
                <p className="text-4xs text-slate-400 mt-1">Tiempo que pasas persiguiendo transferencias bancarias.</p>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-purple-500" />
                  Liquidez atorada en cartera
                </span>
                <span className="text-xl font-black text-purple-600 ">{formatMoney(liquidityAtRisk)}</span>
                <p className="text-4xs text-slate-400 mt-1">Capital de trabajo atrapado por la falta de cobranza automatizada.</p>
              </div>
            </div>

          </div>
        </div>

        {/* TESTIMONIALS */}
        <div className="mx-auto max-w-6xl mt-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900">
              Freelancers que ya no persiguen pagos
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 relative">
              <div className="flex text-amber-400"><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/></div>
              <p className="text-sm text-slate-600 italic">&quot;Antes me daba pena cobrar el anticipo. Ahora el sistema se encarga. El cliente lee el contrato, firma digitalmente y sabe que debe depositar para que yo inicie.&quot;</p>
              <div className="mt-auto flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">MG</div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Mariana G.</div>
                  <div className="text-xs text-slate-500">Diseñadora UI/UX</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 relative">
              <div className="flex text-amber-400"><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/></div>
              <p className="text-sm text-slate-600 italic">&quot;Me salvó de un cliente que no quería pagar el finiquito. Como tenía el registro de aceptación del contrato y de los hitos aprobados, le mostré el log de auditoría y pagó al día siguiente.&quot;</p>
              <div className="mt-auto flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="h-10 w-10 bg-cyan-100 rounded-full flex items-center justify-center font-bold text-cyan-600">CR</div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Carlos R.</div>
                  <div className="text-xs text-slate-500">Desarrollador Full-Stack</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4 relative">
              <div className="flex text-amber-400"><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/><Star className="h-4 w-4 fill-current"/></div>
              <p className="text-sm text-slate-600 italic">&quot;Pase de RESICO a la herramienta y fue súper sencillo. Las cláusulas fiscales ya vienen incluidas, por lo que mis facturas de honorarios cuadran perfecto con los montos sin pelear por el IVA.&quot;</p>
              <div className="mt-auto flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">LP</div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Laura P.</div>
                  <div className="text-xs text-slate-500">Consultora de Marketing</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRICING PLANS */}
        <div id="precios" className="mx-auto max-w-4xl w-full text-center flex flex-col gap-8 scroll-mt-24 mt-12">
          <div>
            <h3 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900">Planes Justos para Freelancers</h3>
            <p className="text-base text-slate-500 mt-2">
              Comienza gratis hoy mismo. Actualiza para desbloquear automatizaciones ilimitadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full text-left">
            {/* Free tier */}
            <div className="glass rounded-3xl p-6 flex flex-col justify-between border-slate-200 bg-white/10 hover:shadow-lg transition-shadow">
              <div>
                <h4 className="font-heading text-lg font-bold text-slate-900">Plan Semilla</h4>
                <p className="text-2xs text-slate-400 mt-1">Ideal para iniciar en el freelance con orden.</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                  <span className="text-xs text-slate-400 ml-1">Gratis de por vida</span>
                </div>
                <ul className="mt-6 flex flex-col gap-3 text-xs text-slate-500 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                    Hasta 3 contratos creados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                    Aceptación por clickwrap express
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                    Plantillas de contrato básicas (MXN)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                    Generador de links de WhatsApp
                  </li>
                </ul>
              </div>
              <Link 
                href="/register?tier=free"
                className="mt-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-center py-3 text-sm font-bold transition-colors cursor-pointer shadow-md w-full"
              >
                Comenzar Gratis
              </Link>
            </div>

            {/* Starter tier */}
            <div className="glass rounded-3xl p-6 flex flex-col justify-between border-emerald-500/35 relative overflow-hidden bg-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/10 transition-shadow">
              <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                Popular
              </div>
              <div>
                <h4 className="font-heading text-lg font-bold text-emerald-600">Plan Emprendedor</h4>
                <p className="text-2xs text-slate-500 mt-1">Para profesionales con flujo de clientes constante.</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">$99</span>
                  <span className="text-xs text-slate-500 ml-1">MXN / mes</span>
                </div>
                <ul className="mt-6 flex flex-col gap-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2 text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <strong>Hasta 10 contratos activos</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Monedas múltiples (MXN & USD)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Personalización de logotipos y firmas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    Soporte prioritario
                  </li>
                </ul>
              </div>
              <Link 
                href="/register?tier=starter"
                className="mt-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-center py-3 text-sm font-bold shadow-lg shadow-emerald-600/15 transition-colors cursor-pointer w-full"
              >
                Suscribirse a Emprendedor
              </Link>
            </div>

            {/* Pro tier */}
            <div className="glass rounded-3xl p-6 flex flex-col justify-between border-purple-500/35 relative overflow-hidden bg-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-shadow">
              <div>
                <h4 className="font-heading text-lg font-bold text-purple-600">Plan Profesional</h4>
                <p className="text-2xs text-slate-500 mt-1">Control absoluto, automatización y conciliación.</p>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900">$199</span>
                  <span className="text-xs text-slate-500 ml-1">MXN / mes</span>
                </div>
                <ul className="mt-6 flex flex-col gap-3 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2 text-slate-900">
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
                className="mt-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-center py-3 text-sm font-bold shadow-lg shadow-purple-600/15 transition-colors cursor-pointer w-full"
              >
                Suscribirse a Pro
              </Link>
            </div>
          </div>
        </div>

        {/* LEGAL VULNERABILITIES & FAQ ACCORDION */}
        <div id="faq" className="mx-auto max-w-3xl w-full text-left scroll-mt-24 mt-12">
          <div className="flex items-center gap-2 text-purple-500 justify-center mb-6">
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Preguntas Frecuentes y Respaldo Legal</span>
          </div>
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight text-slate-900 mb-10">
            Aclaramos tus dudas
          </h2>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index}
                  className="glass rounded-2xl p-5 transition-all duration-300 border-slate-200 cursor-pointer hover:border-purple-300 hover:shadow-md"
                  onClick={() => toggleFaq(index)}
                >
                  <div className="flex items-center justify-between gap-4 font-bold text-sm text-slate-800">
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-purple-600" : ""
                    }`} />
                  </div>
                  {isOpen && (
                    <div className="mt-4 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Link href="/faq" className="inline-flex items-center justify-center rounded-xl bg-purple-50 px-6 py-3 text-sm font-semibold text-purple-600 hover:bg-purple-100 transition-colors">
              Ver todas las preguntas frecuentes
            </Link>
          </div>
        </div>

        {/* Call to Action card */}
        <div className="mx-auto max-w-5xl w-full rounded-3xl bg-gradient-to-tr from-purple-900 via-slate-900 to-slate-950 p-10 text-white shadow-2xl relative overflow-hidden text-left mt-12">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <ShieldCheck className="h-96 w-96" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h3 className="font-heading text-3xl font-extrabold mb-3">Protege tu trabajo hoy mismo</h3>
              <p className="text-base text-slate-300 leading-relaxed font-light">
                Únete a los freelancers que ya no persiguen pagos informales. Crea tu primer contrato en minutos y asegúrate de cobrar lo que mereces, a tiempo.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-cyan-500 px-8 py-4 text-sm font-bold text-slate-950 hover:bg-cyan-400 hover:scale-105 transition-all shadow-xl shadow-cyan-500/20 whitespace-nowrap"
            >
              Crear mi Primer Contrato
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer background gradients */}
      <div className="absolute inset-x-0 top-[calc(100%-25rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-40rem)]" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-cyan-400 to-purple-500 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
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
