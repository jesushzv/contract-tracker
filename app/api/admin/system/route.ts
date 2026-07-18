import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminUtils';

export async function GET() {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, since Vercel API might be complex to set up without a token,
    // we return static placeholder data for the system health tab.
    // In a production environment, this would call Vercel's REST API or Datadog.

    const mockDeployments = [
      {
        id: 'dpl_1',
        name: 'contract-tracker',
        state: 'READY',
        createdAt: new Date().getTime(),
        creator: 'jhzamora',
        url: 'https://contract-tracker.vercel.app'
      },
      {
        id: 'dpl_2',
        name: 'contract-tracker',
        state: 'READY',
        createdAt: new Date(Date.now() - 86400000).getTime(),
        creator: 'jhzamora',
        url: 'https://contract-tracker-prev.vercel.app'
      },
      {
        id: 'dpl_3',
        name: 'contract-tracker',
        state: 'ERROR',
        createdAt: new Date(Date.now() - 172800000).getTime(),
        creator: 'jhzamora',
        url: 'https://contract-tracker-failed.vercel.app'
      }
    ];

    const mockLogs = [
      { id: 'log_1', level: 'info', message: 'User logged in successfully', timestamp: new Date().toISOString() },
      { id: 'log_2', level: 'error', message: 'Failed to process Stripe webhook', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'log_3', level: 'warn', message: 'Rate limit approaching for API', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'log_4', level: 'info', message: 'Contract created by user', timestamp: new Date(Date.now() - 10800000).toISOString() }
    ];

    const systemStatus = {
      database: 'operational',
      storage: 'operational',
      auth: 'operational',
      paymentGateway: 'operational',
      emailService: 'operational'
    };

    return NextResponse.json({
      deployments: mockDeployments,
      logs: mockLogs,
      status: systemStatus
    });
  } catch (error) {
    console.error('Admin system get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
