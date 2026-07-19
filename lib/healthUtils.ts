/* eslint-disable @typescript-eslint/no-explicit-any */

export async function checkDatabaseHealth(adminClient: any): Promise<string> {
  try {
    const { error } = await adminClient.from('profiles').select('id').limit(1);
    if (error) throw error;
    return 'operational';
  } catch (e) {
    console.error('Database health check failed:', e);
    return 'error';
  }
}

export async function checkStorageHealth(adminClient: any): Promise<string> {
  try {
    const { error } = await adminClient.storage.listBuckets();
    if (error) throw error;
    return 'operational';
  } catch (e) {
    console.error('Storage health check failed:', e);
    return 'error';
  }
}

export async function checkAuthHealth(adminClient: any): Promise<string> {
  try {
    const { error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    return 'operational';
  } catch (e) {
    console.error('Auth health check failed:', e);
    return 'error';
  }
}

export async function checkStripeHealth(stripe: any, hasKey: boolean): Promise<string> {
  try {
    if (hasKey) {
      await stripe.paymentIntents.list({ limit: 1 });
      return 'operational';
    }
    return 'error';
  } catch (e) {
    console.error('Stripe health check failed:', e);
    return 'error';
  }
}

export async function checkEmailHealth(hasKey: boolean): Promise<string> {
  return hasKey ? 'operational' : 'error';
}
