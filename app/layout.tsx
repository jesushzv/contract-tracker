import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import Link from "next/link";
import ApiKeyGuard from "./ApiKeyGuard";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Contrato & Anticipo Tracker | Freelance MX",
  description: "Crea contratos con validez digital rápida y gestiona tus anticipos/pagos SPEI en un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fafbfe] text-[#0f172a] dark:bg-[#090d16] dark:text-[#f8fafc] transition-colors duration-300">
        <ApiKeyGuard>
          <header className="sticky top-0 z-50 w-full border-b border-[#6366f1]/10 bg-white/70 backdrop-blur-md dark:bg-[#090d16]/70 dark:border-[#6366f1]/20 print:hidden">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 shadow-md shadow-indigo-500/20">
                  <span className="text-lg font-extrabold text-white">₳</span>
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-emerald-400">
                    Anticipo
                  </span>
                  <span className="text-xs font-semibold text-slate-400 ml-1 block sm:inline">MX</span>
                </div>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <a href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">
                  Panel
                </a>
                <a href="/contracts/new" className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors">
                  Nuevo Contrato
                </a>
              </nav>

              <div className="flex items-center gap-4">
                <a 
                  href="/dashboard" 
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-all duration-200"
                >
                  Mi Panel
                </a>
              </div>
            </div>
          </header>

          <main className="flex-grow flex flex-col">
            {children}
          </main>

          <footer className="border-t border-[#6366f1]/10 bg-white/50 py-8 dark:bg-[#090d16]/30 dark:border-[#6366f1]/20 print:hidden">
            <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8">
              <p className="font-medium">
                &copy; {new Date().getFullYear()} Anticipo MX. Creado para los freelancers en México.
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Aviso legal: Los formatos proveídos son plantillas de carácter ilustrativo y no constituyen asesoría legal.
              </p>
            </div>
          </footer>
        </ApiKeyGuard>
      </body>
    </html>
  );
}
