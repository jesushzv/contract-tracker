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
    // Assuming starter=$10, pro=$30 (can adjust based on actual pricing)
    const mrr = (usersByTier.starter || 0) * 199 + (usersByTier.pro || 0) * 499;

    // Generate mock time-series data for charts (Last 7 days)
    // In a real scenario, this would aggregate `created_at` from DB
    const days = 7;
    const chartData = Array.from({ length: days }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return {
        date: d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
        newUsers: Math.floor(Math.random() * 10) + 1,
        contracts: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 1000) + 200
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
