import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";
import Header from "./Header";
import Footer from "./Footer";
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
  title: "Mi Pacto | Gestión de Contratos para Freelancers",
  description: "Crea contratos con validez digital, firma express por WhatsApp y controla tus cobros SPEI. mipacto.app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  console.log("SERVER COOKIES:", cookieStore.getAll());
  
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '812279541878360');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=812279541878360&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <ApiKeyGuard>
          <Header hasAuthCookie={hasAuthCookie} useSupabase={useSupabase} />

          <main className="flex-grow flex flex-col">
            {children}
          </main>

          <Footer />
        </ApiKeyGuard>
      </body>
    </html>
  );
}
