"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle, ChevronDown } from "lucide-react";
import Header from "../Header";

export default function FaqPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      category: "Legal & Seguridad",
      items: [
        {
          q: "¿Qué validez legal tiene en México la aceptación digital?",
          a: "Totalmente vinculante. Bajo el artículo 89 del Código de Comercio de México, los contratos electrónicos firmados mediante firma digital simple (clickwrap con aceptación de términos, registro de dirección IP y marca de tiempo) tienen plena validez legal y son admisibles ante tribunales civiles y comerciales."
        },
        {
          q: "¿Cómo ayuda a evitar demandas por subordinación laboral?",
          a: "Nuestros contratos integran cláusulas específicas que documentan la autonomía del freelancer (ausencia de horario fijo, uso de herramientas propias y carácter estrictamente mercantil del servicio), desvirtuando los elementos de una relación de trabajo subordinada regulada por la Ley Federal del Trabajo (LFT)."
        },
        {
          q: "¿Es seguro enviar el contrato por WhatsApp?",
          a: "Sí. Generamos un enlace único, ofuscado y seguro (tokenizado) que solo tu cliente puede abrir. Además, guardamos un log inmutable de la fecha, hora e IP desde la cual el cliente accede y acepta los términos."
        }
      ]
    },
    {
      category: "Pagos y SPEI",
      items: [
        {
          q: "¿Necesito conectar mis contraseñas bancarias al tracker?",
          a: "¡No! Diseñamos esto con seguridad de primer nivel. Tú solo ingresas tu CLABE Interbancaria de manera estática. Tu cliente te transfiere directamente por SPEI desde su app de banco habitual y nos reporta la 'Clave de Rastreo' que verificamos en el portal Banxico CEP sin comprometer tus cuentas."
        },
        {
          q: "¿Ustedes cobran comisión por las transferencias?",
          a: "No. Nosotros no somos una pasarela de pago (como PayPal o Stripe). Somos un software de gestión de contratos. Tu cliente te transfiere directo a tu cuenta bancaria vía SPEI, por lo que recibes el 100% de tu dinero sin comisiones por transacción."
        },
        {
          q: "¿Puedo cobrar en dólares (USD)?",
          a: "Sí. En los planes Emprendedor y Profesional puedes definir el contrato en USD o MXN. El cliente podrá subir el comprobante de transferencia internacional (wire transfer) y registrar el tipo de cambio pactado."
        }
      ]
    },
    {
      category: "Facturación (RESICO)",
      items: [
        {
          q: "¿Las plantillas incluyen el cálculo de retenciones RESICO?",
          a: "Sí. Cuando seleccionas que eres Persona Física tributando en RESICO y tu cliente es Persona Moral, el sistema calcula automáticamente la retención de ISR (1.25%) y las retenciones de IVA correspondientes en el presupuesto final."
        },
        {
          q: "¿Ustedes emiten la factura (CFDI) automáticamente?",
          a: "En la versión actual te entregamos el desglose exacto (Subtotal, IVA, Retenciones y Total) para que tu factura cuadre perfectamente al centavo en el portal del SAT. Estamos trabajando en la integración directa de CFDI 4.0 para futuros sprints."
        }
      ]
    }
  ];

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
            <HelpCircle className="h-8 w-8" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Preguntas Frecuentes (FAQ)</h1>
          <p className="text-slate-500 mb-8 pb-8 border-b border-slate-100">
            Encuentra respuestas a las preguntas más comunes sobre Anticipo MX, su validez legal y cómo manejar tus pagos.
          </p>
          
          <div className="flex flex-col gap-10">
            {faqs.map((category, catIndex) => (
              <div key={catIndex}>
                <h2 className="text-xl font-bold text-slate-900 mb-4">{category.category}</h2>
                <div className="flex flex-col gap-3">
                  {category.items.map((faq, itemIndex) => {
                    const globalIndex = catIndex * 100 + itemIndex;
                    const isOpen = openFaq === globalIndex;
                    return (
                      <div 
                        key={globalIndex}
                        className="rounded-2xl p-4 transition-all duration-300 border border-slate-200 bg-slate-50 cursor-pointer hover:border-indigo-300"
                        onClick={() => toggleFaq(globalIndex)}
                      >
                        <div className="flex items-center justify-between gap-4 font-bold text-sm text-slate-800">
                          <span>{faq.q}</span>
                          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-indigo-600" : ""
                          }`} />
                        </div>
                        {isOpen && (
                          <div className="mt-3 text-sm leading-relaxed text-slate-600 border-t border-slate-200 pt-3">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
