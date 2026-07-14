"use client";

import { useState, useEffect, useMemo } from "react";
import { FileText, ExternalLink, Filter, Search, Eye } from "lucide-react";
import { getContracts, getMilestones, getAuditLogs } from "@/lib/storageClient";
import { Contract } from "@/lib/types";

interface DocumentItem {
  id: string;
  contractId: string;
  contractTitle: string;
  clientName: string;
  type: 'contract' | 'receipt' | 'audit_log';
  name: string;
  url: string;
  date: string;
  uploadedBy?: string;
  referenceNumber?: string;
}

export default function DocumentsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        const conList = await getContracts();
        const miles = await getMilestones();
        setContracts(conList);

        const docItems: DocumentItem[] = [];

        for (const c of conList) {
          // 1. Add contract itself
          docItems.push({
            id: `contract-${c.id}`,
            contractId: c.id,
            contractTitle: `Contrato de servicios con ${c.clientName}`,
            clientName: c.clientName,
            type: 'contract',
            name: `Contrato Digital — ${c.clientName} (Monto: $${c.totalAmount})`,
            url: `/c/${c.id}?token=${c.clientAccessToken || ''}`,
            date: c.created_at
          });

          // 2. Add Audit Log
          docItems.push({
            id: `audit-${c.id}`,
            contractId: c.id,
            contractTitle: `Contrato de servicios con ${c.clientName}`,
            clientName: c.clientName,
            type: 'audit_log',
            name: `Certificado de Auditoría Digital — ${c.id}`,
            url: `#`,
            date: c.updated_at || c.created_at
          });

          // 3. Add Milestones receipts
          const cMilestones = miles.filter(m => m.contractId === c.id);
          cMilestones.forEach(m => {
            if (m.receiptUrl) {
              docItems.push({
                id: `receipt-${m.id}`,
                contractId: c.id,
                contractTitle: `Contrato de servicios con ${c.clientName}`,
                clientName: c.clientName,
                type: 'receipt',
                name: `Comprobante SPEI — Hito: "${m.label}"`,
                url: m.receiptUrl,
                date: m.markedPaidAt || m.confirmedAt || c.created_at,
                uploadedBy: m.receiptUploadedBy || "client",
                referenceNumber: m.trackingReference || m.speiReference || undefined
              });
            }
          });
        }

        setDocuments(docItems);
      } catch (err) {
        console.error("Error loading documents:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredDocs = useMemo(() => {
    let result = documents;

    if (selectedProject !== "all") {
      result = result.filter(d => d.contractId === selectedProject);
    }

    if (selectedType !== "all") {
      result = result.filter(d => d.type === selectedType);
    }

    if (searchQuery) {
      result = result.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.referenceNumber && d.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return result;
  }, [selectedProject, selectedType, searchQuery, documents]);

  const handleAuditPrint = async (contractId: string) => {
    const logs = await getAuditLogs(contractId);
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor, permite ventanas emergentes.");
      return;
    }

    const logRows = logs.map(log => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(log.timestamp).toLocaleString("es-MX")}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${log.actor.toUpperCase()}</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${log.details}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace;">${log.ip || "N/A"}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Certificado de Auditoría - ${contract.id}</title>
          <style>
            body { font-family: sans-serif; color: #333; margin: 40px; }
            h1 { font-size: 20px; color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 20px; }
            th { text-align: left; background: #f8fafc; padding: 10px; border-bottom: 2px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <h1>Certificado de Auditoría Digital</h1>
          <p><strong>Contrato ID:</strong> ${contract.id}</p>
          <p><strong>Freelancer:</strong> ${contract.beneficiaryName || "N/A"}</p>
          <p><strong>Cliente:</strong> ${contract.clientName} (${contract.clientEmail})</p>
          <table>
            <thead>
              <tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>IP</th></tr>
            </thead>
            <tbody>${logRows}</tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex-grow flex flex-col gap-6 text-slate-800 dark:text-slate-200">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          Expediente de Documentos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Historial y repositorio unificado de contratos, recibos SPEI y registros de auditoría de todos tus proyectos.
        </p>
      </div>

      <div className="glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 w-full relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cliente, folio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-indigo-500 focus:outline-none dark:text-white transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none border-none pr-6 cursor-pointer"
            >
              <option value="all">Todos los proyectos</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>{c.clientName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-xs font-semibold focus:outline-none border-none pr-6 cursor-pointer"
            >
              <option value="all">Todos los tipos</option>
              <option value="contract">Contratos</option>
              <option value="receipt">Recibos SPEI</option>
              <option value="audit_log">Auditorías</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-slate-450 text-sm">
            Cargando expedientes...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-16 text-slate-450 text-sm flex flex-col items-center justify-center gap-3">
            <FileText className="h-10 w-10 text-slate-350" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-300">No se encontraron documentos</h4>
            <p className="text-xs text-slate-400">Intenta cambiar los filtros o el término de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-900">
              <thead className="bg-slate-50 dark:bg-slate-900/60">
                <tr>
                  <th className="px-6 py-4 text-left text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Documento</th>
                  <th className="px-6 py-4 text-left text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Cliente / Contrato</th>
                  <th className="px-6 py-4 text-left text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-6 py-4 text-left text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Detalles</th>
                  <th className="px-6 py-4 text-right text-2xs font-extrabold text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-850 dark:text-white block">{doc.name}</span>
                          <span className="text-3xs text-slate-400 capitalize">{doc.type === 'audit_log' ? 'Bitácora de Auditoría' : doc.type === 'receipt' ? 'Comprobante de pago' : 'Contrato Legal'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{doc.clientName}</span>
                        <span className="text-3xs text-slate-400 max-w-[200px] truncate">{doc.contractTitle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(doc.date).toLocaleDateString("es-MX", { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {doc.type === 'receipt' ? (
                        <div className="flex flex-col gap-0.5">
                          {doc.referenceNumber && (
                            <span className="text-3xs text-slate-500 dark:text-slate-400 font-mono">Ref: {doc.referenceNumber}</span>
                          )}
                          <span className="text-3xs text-slate-400">Subido por: {doc.uploadedBy === 'freelancer' ? 'Freelancer' : 'Cliente'}</span>
                        </div>
                      ) : (
                        <span className="text-3xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {doc.type === 'audit_log' ? (
                        <button
                          onClick={() => handleAuditPrint(doc.contractId)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-650 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> Imprimir
                        </button>
                      ) : (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-650"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Abrir
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
