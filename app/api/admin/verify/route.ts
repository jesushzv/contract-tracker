import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getSupabaseClient } from '@/lib/storageSupabase';

// Using the Supabase JWT secret to sign our admin session cookie
const ADMIN_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback_secret_for_dev';

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // 1. Get user ID from Supabase auth token
    let userId = null;
    const authCookie = cookieStore.getAll().find((cookie) => 
      cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
    );
    if (authCookie) {
      try {
        const parsed = JSON.parse(authCookie.value);
        if (parsed?.user?.id) {
          userId = parsed.user.id;
        }
      } catch (e) {
        console.error("Error parsing auth cookie", e);
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { isAdmin: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. Check if user is an admin in the profiles table (bypassing RLS with service role)
    const adminClient = await getSupabaseClient(true);
    const { data: profile, error } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
      
    if (error || !profile || !profile.is_admin) {
      return NextResponse.json(
        { isAdmin: false },
        { status: 403 }
      );
    }
    
    // 3. User is an admin. Set a secure signed cookie.
    // We use a simple HMAC to sign the userId.
    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
    const payload = `${userId}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', ADMIN_JWT_SECRET).update(payload).digest('hex');
    const token = `${payload}.${signature}`;
    
    const response = NextResponse.json({ isAdmin: true });
    
    // Set cookie
    response.cookies.set({
      name: 'admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours in seconds
    });
    
    return response;
  } catch (error) {
    console.error('Error verifying admin:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
