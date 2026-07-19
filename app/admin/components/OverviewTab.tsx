'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, FileText, TrendingUp, DollarSign, Loader2, ArrowUpRight } from 'lucide-react';
import { formatMxn } from '@/lib/formatUtils';

export default function OverviewTab() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError(`Error ${res.status}: ${res.statusText}`);
        }
      } catch (err) {
        setError('Network error or failed to load data');
        console.error('Failed to fetch overview analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

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
        Failed to load dashboard: {error || 'Missing data'}. Did you run the database migrations?
      </div>
    );
  }

  const { kpis, timeSeries } = data;
  const recentData = [...timeSeries].reverse().slice(0, 5); // Last 5 days

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: kpis.totalUsers, icon: Users, trend: '+12%' },
          { label: 'Active Subscribers', value: kpis.activeSubscribers, icon: TrendingUp, trend: '+5%' },
          { label: 'Contracts Created', value: kpis.totalContracts, icon: FileText, trend: '+24%' },
          { label: 'Estimated MRR', value: formatMxn(kpis.estimatedMRR), icon: DollarSign, trend: '+8%' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white border border-neutral-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <Icon className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.trend} <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </span>
              </div>
              <h3 className="text-3xl font-bold text-neutral-900">{stat.value}</h3>
              <p className="text-sm font-medium text-neutral-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Recent Activity Table */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
          <div className="px-5 py-4 border-b border-neutral-200">
            <h3 className="font-semibold text-neutral-900">Recent Platform Activity (Last 5 Days)</h3>
          </div>
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase">New Users</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Contracts</th>
                <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {recentData.map((row: any, i: number) => (
                <tr key={i}>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-neutral-900 font-medium">{row.date}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-neutral-500">{row.newUsers}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-neutral-500">{row.contracts}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-green-600 font-medium">{formatMxn(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Action Center */}
        <div className="bg-indigo-600 rounded-lg shadow-sm p-6 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Welcome to the Admin Command Center</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
              You have full control over the platform from here. Check user activity, review incoming feedback, manage system health, run promotions, and organize email campaigns seamlessly.
            </p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/admin?tab=feedback')}
              className="w-full text-left bg-indigo-700 hover:bg-indigo-800 rounded p-4 flex justify-between items-center transition-colors cursor-pointer border border-transparent focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              <div>
                <p className="font-semibold text-white">Review Unresolved Feedback</p>
                <p className="text-xs text-indigo-200 mt-0.5">Check what users are saying</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-white opacity-75" />
            </button>
            <button 
              onClick={() => router.push('/admin?tab=system')}
              className="w-full text-left bg-indigo-700 hover:bg-indigo-800 rounded p-4 flex justify-between items-center transition-colors cursor-pointer border border-transparent focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              <div>
                <p className="font-semibold text-white">Check System Health</p>
                <p className="text-xs text-indigo-200 mt-0.5">View recent Vercel deployments</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-white opacity-75" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
