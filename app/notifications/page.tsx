"use client";

import { useState, useEffect } from "react";
import { Bell, Check, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { getNotifications, markNotificationRead, getProfile } from "@/lib/storageClient";
import { Notification } from "@/lib/types";
import { AppShell } from "../components/AppShell";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const prof = await getProfile();
        if (prof && prof.id) {
          const list = await getNotifications(prof.id);
          setNotifications(list);
        }
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.isRead);
      for (const n of unread) {
        await markNotificationRead(n.id);
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  return (
    <AppShell activePath="/notifications">
      <div className="mx-auto w-full max-w-4xl flex flex-col gap-6 text-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="h-8 w-8 text-indigo-500" />
              Notificaciones
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Revisa las alertas de actividad en tus contratos, firmas de clientes, y reportes de pagos SPEI.
            </p>
          </div>

          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Check className="h-4 w-4 text-emerald-500" />
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Cargando notificaciones...
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Sin notificaciones</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                No tienes notificaciones de actividad por el momento. Cuando tus clientes firmen o reporten transferencias, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                  className={`bg-white rounded-2xl p-5 border text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    notif.isRead
                      ? "border-slate-200 opacity-80"
                      : "border-indigo-500/25 bg-indigo-50/50 cursor-pointer shadow-sm shadow-indigo-500/5"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                      notif.isRead 
                        ? "bg-slate-100 border-slate-200 text-slate-400"
                        : "bg-indigo-100 border-indigo-200 text-indigo-500"
                    }`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className={`text-sm ${notif.isRead ? "text-slate-600" : "font-bold text-slate-900"}`}>
                        {notif.message}
                      </p>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(notif.created_at).toLocaleString("es-MX")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {notif.contractId && (
                      <Link
                        href={`/dashboard?contract=${notif.contractId}`}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                      >
                        Ver Contrato
                      </Link>
                    )}
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(notif.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
                        title="Marcar como leída"
                      >
                        <Check className="h-4 w-4 text-emerald-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors self-start mt-4"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Inicio
        </Link>
      </div>
    </AppShell>
  );
}
