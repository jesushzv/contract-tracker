import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getSupabaseClient } from '@/lib/storageSupabase';

const ADMIN_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback_secret_for_dev';

/**
 * Validates the admin session from cookies
 * Returns the userId if valid, or null if invalid
 */
export async function verifyAdmin(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    
    // In demo mode, bypass admin verification
    if (cookieStore.get('demo_mode')?.value === 'true') {
      return 'demo-admin-id';
    }

    const adminSession = cookieStore.get('admin_session');
    
    if (!adminSession?.value) return null;
    
    // Parse token: payload.signature
    const parts = adminSession.value.split('.');
    if (parts.length !== 2) return null;
    
    const [payload, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', ADMIN_JWT_SECRET).update(payload).digest('hex');
    
    if (signature !== expectedSignature) return null;
    
    // Check expiration
    const [userId, expStr] = payload.split(':');
    const exp = parseInt(expStr, 10);
    
    if (Math.floor(Date.now() / 1000) > exp) return null;
    
    return userId;
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return null;
  }
}

/**
 * Returns a Supabase client configured with the service role key
 * This bypasses RLS and should only be used in admin API routes
 */
export async function getAdminSupabaseClient() {
  return await getSupabaseClient(true);
}
