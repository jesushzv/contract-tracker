import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/storageSupabase';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Authenticate regular user
    const cookieStore = await cookies();
    const authCookie = cookieStore.getAll().find((cookie) => 
      cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
    );
    
    let userId = null;
    if (authCookie) {
      try {
        const parsed = JSON.parse(authCookie.value);
        if (parsed?.user?.id) userId = parsed.user.id;
      } catch { }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, subject, message } = body;
    
    if (!category || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Normal client is sufficient for insert because of RLS policy
    const client = await getSupabaseClient();
    
    const { data, error } = await client
      .from('user_feedback')
      .insert({
        user_id: userId,
        category,
        subject,
        message,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting feedback:', error);
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedback: data });
  } catch (error) {
    console.error('User feedback submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
