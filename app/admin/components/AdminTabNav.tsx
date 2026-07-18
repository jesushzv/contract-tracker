'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, MessageSquare, Activity, LineChart, Tag, Mail } from 'lucide-react';
import clsx from 'clsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'system', label: 'System', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
  { id: 'promos', label: 'Promos', icon: Tag },
  { id: 'campaigns', label: 'Campaigns', icon: Mail },
];

export default function AdminTabNav() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const currentTab = searchParams.get('tab') || 'overview';

  return (
    <div className="border-t border-neutral-800 bg-neutral-900 overflow-x-auto scrollbar-hide">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => router.push(`/admin?tab=${tab.id}`)}
                className={clsx(
                  isActive
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-600',
                  'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={clsx(
                    isActive ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-400',
                    '-ml-0.5 mr-2 h-4 w-4'
                  )}
                  aria-hidden="true"
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
