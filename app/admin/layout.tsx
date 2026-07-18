'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminTabNav from './components/AdminTabNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        // In demo mode, bypass auth check
        if (typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true') {
          setIsAdmin(true);
          setIsVerifying(false);
          return;
        }

        const res = await fetch('/api/admin/verify');
        if (res.ok) {
          const data = await res.json();
          if (data.isAdmin) {
            setIsAdmin(true);
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to verify admin status:', error);
        router.push('/dashboard');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAdmin();
  }, [router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Router will redirect
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-neutral-900 text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                FreelanceMX
              </div>
              <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs font-semibold rounded uppercase tracking-wider border border-red-500/20">
                Admin Command Center
              </span>
            </div>
            <div>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Return to Dashboard &rarr;
              </button>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <AdminTabNav />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
