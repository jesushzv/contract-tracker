import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Header from "../Header";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header hasAuthCookie={false} useSupabase={true} />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>
        
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-6">
            <ShieldCheck className="h-8 w-8" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Términos de Servicio</h1>
          <p className="text-slate-500 mb-8 pb-8 border-b border-slate-100">Última actualización: 18 de Julio de 2026</p>
          
          <div className="prose prose-slate max-w-none text-slate-600">
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Aceptación de los Términos</h2>
            <p className="mb-4">
              Al acceder y utilizar Anticipo MX (el &quot;Servicio&quot;), usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al Servicio.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Descripción del Servicio</h2>
            <p className="mb-4">
              Anticipo MX es una plataforma diseñada para facilitar la creación de contratos de prestación de servicios profesionales y el seguimiento de pagos (anticipos e hitos) para freelancers en México. No somos un despacho de abogados y el uso de nuestras plantillas no constituye asesoría legal personalizada.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Validez Legal y Firmas Electrónicas</h2>
            <p className="mb-4">
              Los contratos generados utilizan un mecanismo de firma electrónica simple basado en aceptación por clickwrap, registro de IP y marcas de tiempo, de conformidad con el Código de Comercio de México. Sin embargo, la exigibilidad de cada contrato depende de la veracidad de los datos ingresados por las partes.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Pagos y Suscripciones</h2>
            <p className="mb-4">
              Ofrecemos planes gratuitos y de pago. Las suscripciones de pago se facturan por adelantado de forma mensual. Puede cancelar su suscripción en cualquier momento desde su panel de control. No ofrecemos reembolsos por períodos de facturación parciales.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Limitación de Responsabilidad</h2>
            <p className="mb-4">
              En ningún caso Anticipo MX, sus directores, empleados o afiliados serán responsables por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo, sin limitación, pérdida de beneficios, datos, uso, fondo de comercio u otras pérdidas intangibles, resultantes de (i) su acceso o uso o imposibilidad de acceder o utilizar el Servicio; (ii) cualquier conducta o contenido de cualquier tercero en el Servicio.
            </p>
          </div>
        </div>
      </main>
      
      {/* COMPREHENSIVE FOOTER */}
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
        </div>
      </footer>
    </div>
  );
}
