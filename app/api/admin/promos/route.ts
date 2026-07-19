import { NextResponse } from 'next/server';
import { getAdminSupabaseClient, verifyAdmin } from '@/lib/adminUtils';

// Helper to map DB promo_code to Frontend PromoCode
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbPromoToFrontend(p: any) {
  if (!p) return null;
  return {
    id: p.id,
    code: p.code,
    discount_type: p.discount_percent ? 'percentage' : 'fixed',
    discount_amount: p.discount_percent ? Number(p.discount_percent) : Number(p.discount_amount),
    max_uses: p.max_uses,
    times_used: p.current_uses,
    expires_at: p.valid_until,
    is_active: p.is_active,
    stripe_coupon_id: p.stripe_promotion_id,
    is_stripe_coupon: !!p.stripe_promotion_id,
    created_at: p.created_at
  };
}

export async function GET() {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = await getAdminSupabaseClient();
    
    const { data: promos, error } = await adminClient
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promos:', error);
      return NextResponse.json({ error: 'Failed to fetch promos' }, { status: 500 });
    }

    const mappedPromos = (promos || []).map(mapDbPromoToFrontend);

    return NextResponse.json({ promos: mappedPromos });
  } catch (error) {
    console.error('Admin promos get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, discount_amount, discount_type, expires_at, max_uses, is_stripe_coupon } = body;
    
    if (!code || !discount_amount || !discount_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminClient = await getAdminSupabaseClient();
    
    // Check if code exists
    const { data: existing } = await adminClient
      .from('promo_codes')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Promo code already exists' }, { status: 400 });
    }

    const isPercentage = discount_type === 'percentage';
    const insertData = {
      code: code.toUpperCase(),
      description: `${discount_type === 'percentage' ? `${discount_amount}%` : `$${discount_amount}`} discount code`,
      discount_percent: isPercentage ? discount_amount : null,
      discount_amount: isPercentage ? null : discount_amount,
      valid_until: expires_at,
      max_uses: max_uses || 100,
      stripe_promotion_id: is_stripe_coupon ? `promo_${code.toLowerCase()}` : null,
      is_active: true
    };

    const { data: promo, error } = await adminClient
      .from('promo_codes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating promo:', error);
      return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
    }

    return NextResponse.json({ promo: mapDbPromoToFrontend(promo) });
  } catch (error) {
    console.error('Admin promo create error:', error);
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
    const { id, is_active } = body;
    
    if (!id || is_active === undefined) {
      return NextResponse.json({ error: 'ID and is_active are required' }, { status: 400 });
    }

    const adminClient = await getAdminSupabaseClient();
    
    const { data: promo, error } = await adminClient
      .from('promo_codes')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promo:', error);
      return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 });
    }

    return NextResponse.json({ promo: mapDbPromoToFrontend(promo) });
  } catch (error) {
    console.error('Admin promo update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const adminClient = await getAdminSupabaseClient();
    
    const { error } = await adminClient
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting promo:', error);
      return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin promo delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
