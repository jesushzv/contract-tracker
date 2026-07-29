import { NextResponse } from 'next/server';
import { getAdminSupabaseClient, verifyAdmin } from '@/lib/adminUtils';

export async function GET(request: Request) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = await getAdminSupabaseClient();
    
    // Get URL params for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Fetch profiles
    const { data: profiles, error, count } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Enhance with contract counts
    const enhancedProfiles = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profiles.map(async (profile: any) => {
        const { count: contractCount } = await adminClient
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .eq('freelancer_id', profile.id);
          
        return {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          tier: profile.tier,
          rfc: profile.rfc,
          phone: profile.phone,
          created_at: profile.created_at,
          contractCount: contractCount || 0
        };
      })
    );

    return NextResponse.json({
      users: enhancedProfiles,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
