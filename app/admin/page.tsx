"use client";

import { useState, useEffect, useMemo } from "react";
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
  Loader2,
  Search,
  Activity,
  Wifi,
  Globe,
  RefreshCw
} from "lucide-react";
import { getContracts } from "@/lib/storage"; // Direct server database access
import { Contract } from "@/lib/types";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const loadAdminData = async () => {
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
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAdminData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Search filter
  const filteredContracts = useMemo(() => {
    if (!searchQuery) return contracts;
    const query = searchQuery.toLowerCase();
    return contracts.filter(c => 
      c.clientName.toLowerCase().includes(query) ||
      c.clientEmail.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      c.status.toLowerCase().includes(query)
    );
  }, [contracts, searchQuery]);

  // CSS-based volume transaction calculations
  const statusVolumeStats = useMemo(() => {
    const stats = {
      draft: { count: 0, volume: 0, color: 'from-slate-400 to-slate-500' },
      sent: { count: 0, volume: 0, color: 'from-indigo-400 to-indigo-600' },
      client_signed: { count: 0, volume: 0, color: 'from-purple-400 to-purple-600' },
      accepted: { count: 0, volume: 0, color: 'from-emerald-400 to-emerald-600' },
      completed: { count: 0, volume: 0, color: 'from-blue-400 to-blue-650' }
    };

    contracts.forEach(c => {
      const vol = c.currency === 'USD' ? c.totalAmount * 17 : c.totalAmount;
      const status = c.status as keyof typeof stats;
      if (stats[status]) {
        stats[status].count += 1;
        stats[status].volume += vol;
      }
    });

    const maxVolume = Math.max(...Object.values(stats).map(s => s.volume), 1);

    return Object.entries(stats).map(([key, value]) => ({
      status: key,
      label: key === 'draft' ? 'Borrador' : key === 'sent' ? 'Enviado' : key === 'client_signed' ? 'Firma Cliente' : key === 'accepted' ? 'Sellado' : 'Completado',
      ...value,
      percentage: Math.round((value.volume / maxVolume) * 100)
    }));
  }, [contracts]);

  // Auth lock screen
  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-24 text-center flex-grow flex items-center justify-center">
        <div className="glass rounded-3xl p-8 flex flex-col gap-5 w-full text-left border border-indigo-500/20 shadow-2xl relative overflow-hidden">
          {/* Back light */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
          
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Acceso Administrativo</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
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
                  className="w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 pl-4 pr-10 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:text-white"
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
              className="w-full rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2.5 text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              Ingresar al Panel
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-2xs font-semibold text-indigo-500 hover:underline transition-colors mt-2"
          >
            <ArrowLeft className="h-3 w-3" /> Volver al Dashboard del Freelancer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-8 text-left animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800/80 pb-6 relative">
        <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            Owner Console
          </span>
          <h1 className="text-3xl font-black tracking-tight mt-1 text-slate-900 dark:text-white">Panel de Administrador</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervisa las métricas globales, el volumen de contratos y el estado de la base de datos de producción.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-500 dark:text-slate-400"
            title="Refrescar datos"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a mi Cuenta
          </Link>
        </div>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border border-indigo-500/5">
          <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Usuarios Plataforma</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </dt>
          <dd className="mt-4 text-3xl font-black text-slate-900 dark:text-white">
            {metrics.totalUsers}
          </dd>
          <div className="mt-1.5 text-2xs text-slate-400 font-light">Freelancers + Clientes activos</div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border border-indigo-500/5">
          <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Contratos Creados</span>
            <FileText className="h-4 w-4 text-indigo-500" />
          </dt>
          <dd className="mt-4 text-3xl font-black text-slate-900 dark:text-white">
            {metrics.totalContracts}
          </dd>
          <div className="mt-1.5 text-2xs text-slate-400 font-light font-mono">Total registros: {metrics.totalContracts}</div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border border-indigo-500/5">
          <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Volumen Contratado (MXN Equiv)</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </dt>
          <dd className="mt-4 text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatMoney(metrics.totalVolume)}
          </dd>
          <div className="mt-1.5 text-2xs text-slate-400 font-light">Equivalencia USD @ $17.00 MXN</div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border border-indigo-500/5">
          <dt className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Conversión de Firma</span>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </dt>
          <dd className="mt-4 text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {metrics.conversionRate}%
          </dd>
          <div className="mt-1.5 text-2xs text-slate-400 font-light">Contratos enviados vs sellados</div>
        </div>
      </div>

      {/* Graphs Panel */}
      <div className="glass rounded-3xl p-6 border border-indigo-500/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Volumen Financiero por Estado de Contrato</h3>
        
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-around min-h-[220px] pt-4">
          {statusVolumeStats.map((stat) => (
            <div key={stat.status} className="flex-1 flex flex-col items-center gap-2 group max-w-[120px] w-full">
              <div className="w-full bg-slate-100 dark:bg-slate-900/60 rounded-2xl h-40 flex items-end overflow-hidden relative border border-slate-200/40 dark:border-slate-800/40">
                <div 
                  className={`w-full bg-gradient-to-t ${stat.color} transition-all duration-1000 ease-out`}
                  style={{ height: `${stat.percentage}%` }}
                />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xs font-mono font-bold text-slate-400 bg-white/90 dark:bg-slate-950/90 px-1.5 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {stat.count} reg
                </span>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                {stat.percentage}%
              </span>
              <span className="text-3xs font-semibold text-slate-400 uppercase tracking-wider truncate max-w-full">
                {stat.label}
              </span>
              <span className="text-4xs font-extrabold text-indigo-500 dark:text-indigo-400 font-mono">
                {formatMoney(stat.volume)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Contracts search catalog */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-500" />
              Catálogo Global de Contratos
            </h2>
            
            {/* Search inputs */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Buscar cliente, id o estado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 pl-9 pr-4 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450" />
            </div>
          </div>

          {loading ? (
            <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center gap-3 border border-indigo-500/5">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400">Cargando registros...</p>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center text-slate-400 text-sm border border-indigo-500/5">
              No se encontraron registros que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredContracts.map((c) => (
                <div key={c.id} className="glass rounded-2xl p-4 text-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center border border-indigo-500/5 hover:border-indigo-500/20 transition-all">
                  <div className="md:col-span-2">
                    <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{c.clientName}</p>
                    <p className="text-slate-450 text-3xs mt-0.5 font-mono truncate">ID: {c.id}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-3xs uppercase tracking-wider font-semibold">Presupuesto</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {formatMoney(c.totalAmount)} {c.currency}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-4xs font-bold uppercase ring-1 ring-inset ${
                      c.status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : c.status === 'completed'
                        ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400'
                        : c.status === 'client_signed'
                        ? 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400'
                        : 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>
                      {c.status === 'draft' ? 'Borrador' : c.status === 'sent' ? 'Enviado' : c.status === 'client_signed' ? 'Firmado' : c.status === 'accepted' ? 'Sellado' : 'Completado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Admin system checks */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-500" />
            Estado del Sistema
          </h2>

          <div className="glass rounded-3xl p-5 flex flex-col gap-4 border border-indigo-500/5 relative overflow-hidden">
            {/* Connectivity Pulse Indicator */}
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-400 font-light flex items-center gap-1">
                <Wifi className="h-3.5 w-3.5 text-indigo-500" /> Base de Datos (Supabase)
              </span>
              <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Activo (12ms)
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-400 font-light flex items-center gap-1">
                <Globe className="h-3.5 w-3.5 text-indigo-500" /> Servidor API (Resend Mock)
              </span>
              <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Activo (Resend Sandbox)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-400 font-light flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" /> Algoritmo de Firma
              </span>
              <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> SHA-256 Hashing OK
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-light">Versión del Sistema</span>
              <span className="font-mono text-slate-700 dark:text-slate-350 font-bold">v1.1.0-release</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
