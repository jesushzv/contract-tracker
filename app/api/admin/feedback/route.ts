import { NextResponse } from 'next/server';
import { getAdminSupabaseClient, verifyAdmin } from '@/lib/adminUtils';

export async function GET() {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = await getAdminSupabaseClient();
    
    // Fetch feedback with user email joined
    const { data: feedback, error } = await adminClient
      .from('user_feedback')
      .select('*, profiles!user_id(email, full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    // Map the joined profile data for easier consumption
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedFeedback = feedback.map((item: any) => ({
      ...item,
      userEmail: item.profiles?.email,
      userName: item.profiles?.full_name,
      profiles: undefined
    }));

    return NextResponse.json({ feedback: mappedFeedback });
  } catch (error) {
    console.error('Admin feedback get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, adminReply } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const adminClient = await getAdminSupabaseClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status };
    if (adminReply !== undefined) {
      updateData.admin_reply = adminReply;
      updateData.replied_at = new Date().toISOString();
    }

    const { data: feedback, error } = await adminClient
      .from('user_feedback')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating feedback:', error);
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Admin feedback update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
