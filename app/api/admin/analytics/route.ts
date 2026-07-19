import { NextResponse } from 'next/server';
import { getAdminSupabaseClient, verifyAdmin } from '@/lib/adminUtils';

export async function GET() {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = await getAdminSupabaseClient();
    
    // Get total users
    const { count: totalUsers } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    // Get users by tier
    const { data: tierData } = await adminClient
      .from('profiles')
      .select('tier');
      
    const usersByTier: Record<string, number> = (tierData || []).reduce((acc: Record<string, number>, curr: { tier: string | null }) => {
      const tier = curr.tier || 'free';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});

    // Get total contracts
    const { count: totalContracts } = await adminClient
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    // Calculate MRR (Monthly Recurring Revenue) estimation
    // Starter is $99 MXN/mo, Pro is $199 MXN/mo
    const mrr = (usersByTier.starter || 0) * 99 + (usersByTier.pro || 0) * 199;

    // Fetch profiles and contracts created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentProfiles } = await adminClient
      .from('profiles')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    const { data: recentContracts } = await adminClient
      .from('contracts')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Generate real time-series data for the last 7 days
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      
      const dateStr = d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
      
      // Define day boundaries in UTC
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      
      const newUsersCount = (recentProfiles || []).filter((p: { created_at: string }) => {
        const pDate = new Date(p.created_at);
        return pDate >= dayStart && pDate <= dayEnd;
      }).length;
      
      const contractsCount = (recentContracts || []).filter((c: { created_at: string }) => {
        const cDate = new Date(c.created_at);
        return cDate >= dayStart && cDate <= dayEnd;
      }).length;
      
      // Calculate estimated daily revenue based on new users (20% starter, 5% pro ratio approximation)
      const revenue = Math.round(newUsersCount * 0.20 * 99 + newUsersCount * 0.05 * 199);
      
      return {
        date: dateStr,
        newUsers: newUsersCount,
        contracts: contractsCount,
        revenue: revenue
      };
    });

    return NextResponse.json({
      kpis: {
        totalUsers: totalUsers || 0,
        activeSubscribers: (usersByTier.starter || 0) + (usersByTier.pro || 0),
        totalContracts: totalContracts || 0,
        estimatedMRR: mrr
      },
      distribution: {
        tiers: usersByTier
      },
      timeSeries: chartData
    });
  } catch (error) {
    console.error('Admin analytics get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
