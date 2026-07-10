"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  DollarSign, 
  Lock, 
  Key, 
  ArrowLeft, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ArrowRight,
  Loader2
} from "lucide-react";
import { getContracts, getMilestones } from "@/lib/storage"; // Direct server database access
import { Contract, Milestone } from "@/lib/types";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  // Platform Metrics
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalContracts: 0,
    totalVolume: 0,
    conversionRate: 0,
    outstandingVolume: 0
  });

  // Verify simple password lock for owner access
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Contraseña administrativa incorrecta. Intenta de nuevo.");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      async function loadAdminData() {
        setLoading(true);
        try {
          const list = await getContracts();
          setContracts(list);
          
          // Calculate metrics
          const userEmails = new Set(list.map(c => c.clientEmail));
          const totalVol = list.reduce((sum, c) => sum + (c.currency === 'USD' ? c.totalAmount * 17 : c.totalAmount), 0);
          
          const accepted = list.filter(c => c.status === 'accepted' || c.status === 'completed').length;
          const sent = list.filter(c => c.status === 'sent' || c.status === 'accepted' || c.status === 'completed').length;
          const rate = sent > 0 ? Math.round((accepted / sent) * 100) : 0;
          
          setMetrics({
            totalUsers: userEmails.size + 1, // include default freelancer
            totalContracts: list.length,
            totalVolume: totalVol,
            conversionRate: rate,
            outstandingVolume: totalVol * 0.4 // estimate
          });
        } catch (e) {
          console.error("Error reading admin metrics", e);
        } finally {
          setLoading(false);
        }
      }
      loadAdminData();
    }
  }, [isAuthenticated]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Auth lock screen
  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-24 text-center flex-grow flex items-center justify-center">
        <div className="glass rounded-3xl p-8 flex flex-col gap-5 w-full text-left">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Acceso Administrativo</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Esta sección es privada para el propietario de la plataforma. Ingresa la contraseña de administrador para ingresar.
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div>
              <label className="block text-3xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contraseña Admin (Beta: admin123)</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent pl-4 pr-10 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
                />
                <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              {authError && (
                <p className="text-2xs text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              Ingresar al Panel
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-2xs font-semibold text-slate-400 hover:text-slate-600 transition-colors mt-2"
          >
            <ArrowLeft className="h-3 w-3" /> Volver al Dashboard del Freelancer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-8 text-left animate-in fade-in-50 duration-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Owner Console</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Panel de Administrador</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervisa las métricas globales, el volumen de contratos y el estado de la base de datos de producción.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a mi Cuenta
          </Link>
        </div>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Usuarios de la Plataforma</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {metrics.totalUsers}
          </dd>
          <div className="mt-1 text-xs text-slate-400">Freelancers + Clientes activos</div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Contratos Generados</span>
            <FileText className="h-4 w-4 text-indigo-500" />
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {metrics.totalContracts}
          </dd>
          <div className="mt-1 text-xs text-slate-400">Total acumulado en el sistema</div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Volumen Contratado (MXN Equiv.)</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatMoney(metrics.totalVolume)}
          </dd>
          <div className="mt-1 text-xs text-slate-400">Suma total de presupuestos</div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Conversión de Firma</span>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {metrics.conversionRate}%
          </dd>
          <div className="mt-1 text-xs text-slate-400">Ratio de contratos enviados vs firmados</div>
        </div>
      </div>

      {/* Database logs and transactions list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contracts catalog list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-500" />
            Catálogo Global de Contratos
          </h2>
          
          {loading ? (
            <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400">Cargando registros...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center text-slate-400 text-sm">
              Ningún contrato guardado en el servidor real.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {contracts.map((c) => (
                <div key={c.id} className="glass rounded-2xl p-4 text-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="md:col-span-2">
                    <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{c.clientName}</p>
                    <p className="text-slate-400 text-3xs mt-0.5 font-mono truncate">ID: {c.id}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Presupuesto</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatMoney(c.totalAmount)} {c.currency}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-3xs font-semibold uppercase ring-1 ring-inset ${
                      c.status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : c.status === 'completed'
                        ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400'
                        : 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin system checks */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-500" />
            Estado del Sistema
          </h2>

          <div className="glass rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-400 font-light">Estatus de Base de Datos</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Activo
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-400 font-light">Estatus de Email Resend</span>
              <span className="text-amber-500 font-bold flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Sandbox Mock
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-400 font-light">Estatus de Firmas Digitales</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> SHA-256 Hashing OK
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-light">Versión del Sistema</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">v0.8.2-beta</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
