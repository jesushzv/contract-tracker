import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      
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
              Al acceder y utilizar Mi Pacto (el &quot;Servicio&quot;), usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al Servicio.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Descripción del Servicio</h2>
            <p className="mb-4">
              Mi Pacto es una plataforma diseñada para facilitar la creación de contratos de prestación de servicios profesionales y el seguimiento de pagos (anticipos e hitos) para freelancers en México. No somos un despacho de abogados y el uso de nuestras plantillas no constituye asesoría legal personalizada.
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
              En ningún caso Mi Pacto, sus directores, empleados o afiliados serán responsables por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo, sin limitación, pérdida de beneficios, datos, uso, fondo de comercio u otras pérdidas intangibles, resultantes de (i) su acceso o uso o imposibilidad de acceder o utilizar el Servicio; (ii) cualquier conducta o contenido de cualquier tercero en el Servicio.
            </p>
          </div>
        </div>
      </main>
      

    </div>
  );
}
