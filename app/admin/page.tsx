import OverviewTab from './components/OverviewTab';
import UsersTab from './components/UsersTab';
import FeedbackTab from './components/FeedbackTab';
import SystemTab from './components/SystemTab';
import AnalyticsTab from './components/AnalyticsTab';
import PromosTab from './components/PromosTab';
import CampaignsTab from './components/CampaignsTab';

export default async function AdminPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const currentTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'overview';

  return (
    <div className="space-y-6">
      {currentTab === 'overview' && <OverviewTab />}
      {currentTab === 'users' && <UsersTab />}
      {currentTab === 'feedback' && <FeedbackTab />}
      {currentTab === 'system' && <SystemTab />}
      {currentTab === 'analytics' && <AnalyticsTab />}
      {currentTab === 'promos' && <PromosTab />}
      {currentTab === 'campaigns' && <CampaignsTab />}
      {![
        'overview', 'users', 'feedback', 'system', 'analytics', 'promos', 'campaigns'
      ].includes(currentTab) && (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-neutral-600">Tab no encontrada</h2>
        </div>
      )}
    </div>
  );
}
