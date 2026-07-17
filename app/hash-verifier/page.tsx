"use client";

import { useState } from "react";
import { ShieldCheck, Copy, Check } from "lucide-react";
import { AppShell } from "../components/AppShell";

export default function HashVerifierPage() {
  const [contractText, setContractText] = useState("");
  const [expectedHash, setExpectedHash] = useState("");
  const [computedHash, setComputedHash] = useState("");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const calculateHash = async (text: string) => {
    if (!text.trim()) return "";
    const msgBuffer = new TextEncoder().encode(text.trim());
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerified(null);
    
    if (!contractText) return;
    
    const hash = await calculateHash(contractText);
    setComputedHash(hash);
    
    if (expectedHash) {
      setVerified(hash.toLowerCase().trim() === expectedHash.toLowerCase().trim());
    }
  };

  const copyComputedHash = () => {
    if (!computedHash) return;
    navigator.clipboard.writeText(computedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell activePath="/hash-verifier">
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8 flex-grow flex flex-col gap-6 text-slate-800">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-indigo-500" />
          Verificador de Integridad de Contratos
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pega el texto del contrato para generar su huella digital SHA-256 única y verificar que no haya sido alterado después de la firma.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <form onSubmit={handleVerify} className="glass rounded-3xl p-4 sm:p-6 border border-slate-200 bg-white flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Texto del Contrato</label>
              <textarea
                required
                rows={12}
                placeholder="Pega aquí el contenido completo del contrato firmado (incluyendo nombres y declaraciones)..."
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white/40 px-4 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none transition-all resize-y"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Sello Digital Esperado (Opcional)</label>
              <input
                type="text"
                placeholder="Pega el hash SHA-256 firmado del contrato (ej. del documento de auditoría)"
                value={expectedHash}
                onChange={(e) => setExpectedHash(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white/40 px-4 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              Verificar Sello Digital
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <div className="glass rounded-3xl p-4 sm:p-6 border border-indigo-500/20 bg-indigo-500/5 text-left flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-900">¿Cómo funciona?</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              Cada contrato firmado en <strong>Anticipo MX</strong> genera un <em>Sello de Integridad Digital</em> único (hash criptográfico SHA-256).
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              Si se cambia una sola letra, espacio o coma, la huella digital cambiará por completo. Esto garantiza la inmutabilidad legal de tu acuerdo.
            </p>
          </div>

          {computedHash && (
            <div className="glass rounded-3xl p-4 sm:p-6 border border-slate-200 bg-white text-left flex flex-col gap-3 animate-in fade-in duration-300">
              <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Sello Calculado</span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-2xs break-all leading-normal select-all">
                {computedHash}
              </div>
              <button
                onClick={copyComputedHash}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-3xs font-semibold text-slate-700 hover:bg-slate-50 :bg-slate-900 transition-all cursor-pointer self-start"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copiado" : "Copiar Hash"}
              </button>
            </div>
          )}

          {verified !== null && (
            <div className={`glass rounded-3xl p-4 sm:p-6 border text-left flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300 ${verified ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
              <h4 className={`font-black text-sm ${verified ? 'text-emerald-600 ' : 'text-red-650 '}`}>
                {verified ? "✓ Documento Auténtico" : "✗ Firma Inválida"}
              </h4>
              <p className="text-2xs leading-relaxed text-slate-550">
                {verified 
                  ? "El texto del contrato coincide exactamente con el sello digital esperado. El documento no ha sido alterado." 
                  : "El texto del contrato no coincide con el sello digital esperado. El documento ha sido modificado o el sello esperado es incorrecto."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </AppShell>
  );
}
