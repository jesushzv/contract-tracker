'use client';

import { useState, useEffect } from 'react';
import { Server, Database, ShieldCheck, CreditCard, Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export default function SystemTab() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError(`Error ${res.status}: ${res.statusText}`);
        }
      } catch (err) {
        setError('Network error or failed to load data');
        console.error('Failed to fetch system data:', err);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSystemData();
  }, []);

  const getStatusIcon = (status: string) => {
    if (status === 'operational') return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 flex justify-center text-red-500 bg-red-50 rounded-lg p-4 border border-red-200">
        Failed to load system metrics: {error || 'Missing data'}. Did you run the database migrations?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-900">System Health</h2>
        <button 
          onClick={fetchSystemData}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-md"
        >
          Refresh Status
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { name: 'Database', status: data.status.database, icon: Database },
          { name: 'Storage', status: data.status.storage, icon: Server },
          { name: 'Auth', status: data.status.auth, icon: ShieldCheck },
          { name: 'Payments', status: data.status.paymentGateway, icon: CreditCard },
          { name: 'Email', status: data.status.emailService, icon: Mail },
        ].map((service) => {
          const Icon = service.icon;
          return (
            <div key={service.name} className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <Icon className="h-8 w-8 text-neutral-400 mb-2" />
              <div className="font-medium text-neutral-900 text-sm mb-1">{service.name}</div>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                {getStatusIcon(service.status)}
                <span className={service.status === 'operational' ? 'text-green-700' : 'text-red-700'}>
                  {service.status === 'operational' ? 'Operational' : 'Issue Detected'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deployments */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
          <div className="px-4 py-5 border-b border-neutral-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-neutral-900">Recent Deployments</h3>
            <span className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded text-xs font-medium">Vercel</span>
          </div>
          <ul className="divide-y divide-neutral-200">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {data.deployments.map((deployment: any) => (
              <li key={deployment.id} className="p-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={clsx(
                      "flex-shrink-0 h-2.5 w-2.5 rounded-full mr-3",
                      deployment.state === 'READY' ? "bg-green-500" : 
                      deployment.state === 'ERROR' ? "bg-red-500" : "bg-yellow-500"
                    )} />
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {deployment.url.replace('https://', '')}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={clsx(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      deployment.state === 'READY' ? "bg-green-100 text-green-800" :
                      deployment.state === 'ERROR' ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    )}>
                      {deployment.state}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-neutral-500">
                      by {deployment.creator}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-neutral-500 sm:mt-0">
                    <p>{new Date(deployment.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* System Logs */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
          <div className="px-4 py-5 border-b border-neutral-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-neutral-900">System Logs</h3>
          </div>
          <div className="p-4 sm:px-6 overflow-hidden">
            <div className="space-y-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.logs.map((log: any) => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <span className="text-neutral-500 whitespace-nowrap font-mono text-xs mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={clsx(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider h-fit",
                    log.level === 'error' ? 'bg-red-100 text-red-700' :
                    log.level === 'warn' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  )}>
                    {log.level}
                  </span>
                  <span className="text-neutral-700 font-mono text-xs break-all">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
