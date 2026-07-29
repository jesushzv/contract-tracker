import { NextResponse } from 'next/server';
import { getAdminSupabaseClient, verifyAdmin } from '@/lib/adminUtils';
import { stripe } from '@/lib/stripe';

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

    let stripePromotionId = null;

    if (is_stripe_coupon) {
      if (process.env.STRIPE_SECRET_KEY) {
        try {
          // 1. Create a coupon in Stripe
          const isPercentage = discount_type === 'percentage';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const couponParams: any = {
            id: `COUPON_${code.toUpperCase()}_${Date.now()}`,
            name: `${code.toUpperCase()} Coupon`,
            duration: 'forever',
          };
          if (isPercentage) {
            couponParams.percent_off = discount_amount;
          } else {
            couponParams.amount_off = Math.round(discount_amount * 100); // Stripe expects cents
            couponParams.currency = 'mxn';
          }

          const coupon = await stripe.coupons.create(couponParams);

          // 2. Create the promotion code linked to the coupon
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const promoParams: any = {
            coupon: coupon.id,
            code: code.toUpperCase(),
          };
          if (expires_at) {
            promoParams.expires_at = Math.floor(new Date(expires_at).getTime() / 1000);
          }
          if (max_uses) {
            promoParams.max_redemptions = max_uses;
          }

          const stripePromo = await stripe.promotionCodes.create(promoParams);
          stripePromotionId = stripePromo.id; // Store promotion code ID
        } catch (e) {
          console.error('Failed to create coupon/promotion in Stripe:', e);
          return NextResponse.json({ error: 'Failed to create coupon/promotion in Stripe' }, { status: 400 });
        }
      } else {
        // Fallback for dev/mock mode
        stripePromotionId = `promo_${code.toLowerCase()}`;
      }
    }

    const isPercentage = discount_type === 'percentage';
    const insertData = {
      code: code.toUpperCase(),
      description: `${discount_type === 'percentage' ? `${discount_amount}%` : `$${discount_amount}`} discount code`,
      discount_percent: isPercentage ? discount_amount : null,
      discount_amount: isPercentage ? null : discount_amount,
      valid_until: expires_at,
      max_uses: max_uses || 100,
      stripe_promotion_id: stripePromotionId,
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
    
    // 1. Fetch promo from DB to get stripe_promotion_id
    const { data: existingPromo } = await adminClient
      .from('promo_codes')
      .select('stripe_promotion_id')
      .eq('id', id)
      .single();

    if (existingPromo?.stripe_promotion_id && process.env.STRIPE_SECRET_KEY && existingPromo.stripe_promotion_id.startsWith('promo_')) {
      try {
        await stripe.promotionCodes.update(existingPromo.stripe_promotion_id, {
          active: is_active
        });
      } catch (e) {
        console.error('Failed to update promotion code status in Stripe:', e);
      }
    }
    
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
    
    // 1. Fetch promo from DB to get stripe_promotion_id
    const { data: existingPromo } = await adminClient
      .from('promo_codes')
      .select('stripe_promotion_id')
      .eq('id', id)
      .single();

    if (existingPromo?.stripe_promotion_id && process.env.STRIPE_SECRET_KEY && existingPromo.stripe_promotion_id.startsWith('promo_')) {
      try {
        await stripe.promotionCodes.update(existingPromo.stripe_promotion_id, {
          active: false
        });
      } catch (e) {
        console.error('Failed to deactivate promotion code in Stripe on delete:', e);
      }
    }
    
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
