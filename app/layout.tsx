import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import { cookies } from "next/headers";
import Header from "./Header";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((c) => {
    if (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) {
      try {
        const val = JSON.parse(c.value);
        if (val === true || val === "true") return true;
        if (val && typeof val === "object" && val.access_token) return true;
      } catch {
        if (c.value === "true") return true;
      }
    }
    return false;
  });
  const useSupabase = 
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "" && 
    process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview";

  return (
    <html
      lang="es"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fafbfe] text-[#0f172a] transition-colors duration-300">
        <ApiKeyGuard>
          <Header hasAuthCookie={hasAuthCookie} useSupabase={useSupabase} />

          <main className="flex-grow flex flex-col">
            {children}
          </main>

          <footer className="border-t border-[#6366f1]/10 bg-white/50 py-8 print:hidden">
            <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
              <p className="font-medium">
                &copy; {new Date().getFullYear()} Anticipo MX. Creado para los freelancers en México.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Aviso legal: Los formatos proveídos son plantillas de carácter ilustrativo y no constituyen asesoría legal.
              </p>
            </div>
          </footer>
        </ApiKeyGuard>
      </body>
    </html>
  );
}
