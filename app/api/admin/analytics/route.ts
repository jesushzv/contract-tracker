import { NextResponse } from 'next/server';
import { getAdminSupabaseClient, verifyAdmin } from '@/lib/adminUtils';

export async function GET() {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = await getAdminSupabaseClient();
    
    // Fetch all profiles to filter test/admin accounts
    const { data: allProfiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, tier, email, created_at, is_admin');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Filter out test and admin accounts from metrics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isTestOrAdmin = (p: any) => {
      if (p.is_admin) return true;
      const email = (p.email || '').toLowerCase();
      return email.endsWith('@example.com') || email.endsWith('@freelancemx.dev');
    };

    const realProfiles = (allProfiles || []).filter((p: { id: string; tier: string | null; email: string | null; created_at: string; is_admin: boolean | null }) => !isTestOrAdmin(p));
    const realUserIds = new Set(realProfiles.map((p: { id: string }) => p.id));

    // Get total users
    const totalUsers = realProfiles.length;

    // Get users by tier
    const usersByTier: Record<string, number> = realProfiles.reduce((acc: Record<string, number>, curr: { tier: string | null }) => {
      const tier = curr.tier || 'free';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});

    // Fetch all contracts to filter out test/admin contracts
    const { data: allContracts, error: contractsError } = await adminClient
      .from('contracts')
      .select('id, freelancer_id, created_at');

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
    }

    const realContracts = (allContracts || []).filter((c: { id: string; freelancer_id: string; created_at: string }) => realUserIds.has(c.freelancer_id));
    const totalContracts = realContracts.length;

    // Calculate MRR (Monthly Recurring Revenue) estimation
    // Starter is $99 MXN/mo, Pro is $199 MXN/mo
    const mrr = (usersByTier.starter || 0) * 99 + (usersByTier.pro || 0) * 199;

    // Fetch profiles and contracts created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRealProfiles = realProfiles.filter((p: { created_at: string }) => new Date(p.created_at) >= sevenDaysAgo);
    const recentRealContracts = realContracts.filter((c: { created_at: string }) => new Date(c.created_at) >= sevenDaysAgo);

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
      
      const newUsersCount = recentRealProfiles.filter((p: { created_at: string }) => {
        const pDate = new Date(p.created_at);
        return pDate >= dayStart && pDate <= dayEnd;
      }).length;
      
      const contractsCount = recentRealContracts.filter((c: { created_at: string }) => {
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
