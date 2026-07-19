import { NextResponse } from 'next/server';
import { getAdminSupabaseClient, verifyAdmin } from '@/lib/adminUtils';
import { stripe } from '@/lib/stripe';

export async function GET(request: Request) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = await getAdminSupabaseClient();
    const host = request.headers.get('host') || 'mi-pacto.vercel.app';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const actualUrl = isLocal ? `http://${host}` : `https://${host}`;

    // 1. Database Health Check
    let databaseStatus = 'operational';
    try {
      const { error } = await adminClient.from('profiles').select('id').limit(1);
      if (error) throw error;
    } catch (e) {
      console.error('Database health check failed:', e);
      databaseStatus = 'error';
    }

    // 2. Storage Health Check
    let storageStatus = 'operational';
    try {
      const { error } = await adminClient.storage.listBuckets();
      if (error) throw error;
    } catch (e) {
      console.error('Storage health check failed:', e);
      storageStatus = 'error';
    }

    // 3. Auth Health Check
    let authStatus = 'operational';
    try {
      const { error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) throw error;
    } catch (e) {
      console.error('Auth health check failed:', e);
      authStatus = 'error';
    }

    // 4. Payments (Stripe) Health Check
    let paymentStatus = 'operational';
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        await stripe.paymentIntents.list({ limit: 1 });
      } else {
        paymentStatus = 'error';
      }
    } catch (e) {
      console.error('Stripe health check failed:', e);
      paymentStatus = 'error';
    }

    // 5. Email (Resend) Health Check
    let emailStatus = 'operational';
    try {
      if (!process.env.RESEND_API_KEY) {
        emailStatus = 'error';
      }
    } catch (e) {
      console.error('Resend health check failed:', e);
      emailStatus = 'error';
    }

    const systemStatus = {
      database: databaseStatus,
      storage: storageStatus,
      auth: authStatus,
      paymentGateway: paymentStatus,
      emailService: emailStatus
    };

    // Fetch latest audit logs from DB
    const { data: dbLogs } = await adminClient
      .from('audit_logs')
      .select('id, action, details, timestamp')
      .order('timestamp', { ascending: false })
      .limit(10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedLogs = (dbLogs || []).map((log: any) => ({
      id: log.id,
      level: log.action.toLowerCase().includes('fail') || log.action.toLowerCase().includes('error') ? 'error' : 
             log.action.toLowerCase().includes('warn') ? 'warn' : 'info',
      message: `${log.action.replace('_', ' ').toUpperCase()}: ${log.details}`,
      timestamp: log.timestamp
    }));

    const logs = mappedLogs;

    // Vercel deployment info (live Vercel API integration if configured)
    let deployments: {
      id: string;
      name: string;
      state: string;
      createdAt: number;
      creator: string;
      url: string;
    }[] = [];
    const vercelToken = process.env.VERCEL_BEARER_TOKEN || process.env.VERCEL_ACCESS_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;
    const vercelConfigured = !!vercelToken;

    if (vercelToken) {
      try {
        const queryParams = new URLSearchParams();
        if (vercelProjectId) queryParams.append('projectId', vercelProjectId);
        if (vercelTeamId) queryParams.append('teamId', vercelTeamId);
        queryParams.append('limit', '5');

        const vercelRes = await fetch(`https://api.vercel.com/v7/deployments?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
        });

        if (vercelRes.ok) {
          const vercelData = await vercelRes.json();
          deployments = (vercelData.deployments || []).map((d: {
            uid: string;
            name: string;
            state: string;
            created: string | number;
            creator?: { username: string };
            url: string | null;
          }) => ({
            id: d.uid,
            name: d.name,
            state: d.state,
            createdAt: typeof d.created === 'string' ? parseInt(d.created, 10) : d.created,
            creator: d.creator?.username || 'Vercel System',
            url: d.url ? `https://${d.url}` : actualUrl
          }));
        } else {
          console.error(`Vercel API error: ${vercelRes.status} ${vercelRes.statusText}`);
        }
      } catch (err) {
        console.error('Failed to fetch Vercel deployments:', err);
      }
    }

    return NextResponse.json({
      deployments,
      logs,
      status: systemStatus,
      vercelConfigured
    });
  } catch (error) {
    console.error('Admin system get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
