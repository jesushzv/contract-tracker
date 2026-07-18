import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>
        
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-xl mb-6">
            <ShieldCheck className="h-8 w-8" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Aviso de Privacidad</h1>
          <p className="text-slate-500 mb-8 pb-8 border-b border-slate-100">Última actualización: 18 de Julio de 2026</p>
          
          <div className="prose prose-slate max-w-none text-slate-600">
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Información que Recopilamos</h2>
            <p className="mb-4">
              Recopilamos información que usted nos proporciona directamente al registrarse, crear un perfil, o generar contratos. Esto incluye su nombre, correo electrónico, información fiscal (RFC), y detalles de sus clientes necesarios para los contratos.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Uso de la Información</h2>
            <p className="mb-4">
              Utilizamos la información recopilada para proporcionar, mantener y mejorar nuestros servicios; procesar transacciones y enviar avisos relacionados; generar documentos legales (contratos); y enviar soporte técnico y administrativo.
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Compartir Información</h2>
            <p className="mb-4">
              No compartimos su información personal con terceros, excepto cuando sea necesario para proporcionar el servicio (por ejemplo, pasarelas de pago como Stripe), cumplir con la ley aplicable, o con su consentimiento explícito (por ejemplo, al enviar un contrato a su cliente).
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Seguridad de los Datos</h2>
            <p className="mb-4">
              Implementamos medidas de seguridad diseñadas para proteger su información personal. Los datos sensibles y los enlaces de contratos utilizan protocolos de encriptación y acceso seguro (Row Level Security en nuestra base de datos).
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Sus Derechos</h2>
            <p className="mb-4">
              Usted tiene derecho a acceder, corregir, actualizar o solicitar la eliminación de su información personal. Puede ejercer estos derechos enviando una solicitud a nuestro equipo de soporte desde el panel de control.
            </p>
          </div>
        </div>
      </main>
      

    </div>
  );
}
