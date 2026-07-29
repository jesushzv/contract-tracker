'use client';

import { useState, useEffect } from 'react';
import { Tag, Loader2, Plus, Power, PowerOff, Trash2, CreditCard } from 'lucide-react';
import { PromoCode } from '@/lib/types';
import clsx from 'clsx';

export default function PromosTab() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [amount, setAmount] = useState(0);
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [isStripe, setIsStripe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchPromos = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/promos');
        if (res.ok) {
          const data = await res.json();
          setPromos(data.promos);
        }
      } catch (error) {
        console.error('Failed to fetch promos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setCreating(true);
    
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          discount_type: type,
          discount_amount: amount,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          max_uses: maxUses ? parseInt(maxUses.toString()) : null,
          is_stripe_coupon: isStripe
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create promo');
      }
      
      setPromos([data.promo, ...promos]);
      setShowCreate(false);
      // Reset form
      setCode('');
      setAmount(0);
      setExpiresAt('');
      setMaxUses('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setPromos(promos.map(p => p.id === id ? { ...p, is_active: data.promo.is_active } : p));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const deletePromo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    try {
      const res = await fetch(`/api/admin/promos?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPromos(promos.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete promo:', error);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Promotions & Discounts</h2>
          <p className="text-sm text-neutral-500">Manage Stripe coupons and internal promo codes.</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md transition-colors"
        >
          {showCreate ? 'Cancel' : <><Plus className="h-4 w-4" /> New Promo Code</>}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900 mb-4">Create New Promo Code</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full border border-neutral-300 rounded-md p-2 text-sm uppercase"
                />
              </div>
              
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md p-2 text-sm"
                  >
                    <option value="percentage">% Discount</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full border border-neutral-300 rounded-md p-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Expiration Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full border border-neutral-300 rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Max Uses (Optional)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Leave empty for unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : '')}
                  className="w-full border border-neutral-300 rounded-md p-2 text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="isStripe"
                checked={isStripe}
                onChange={(e) => setIsStripe(e.target.checked)}
                className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="isStripe" className="text-sm text-neutral-700">
                This is a Stripe Coupon (Applies to subscriptions)
              </label>
            </div>
            
            {errorMsg && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={creating}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Saving...' : 'Save Promo Code'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-neutral-200">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Code</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Discount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Usage</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {promos.map((promo) => {

              // eslint-disable-next-line react-hooks/purity
              const isExpired = promo.expires_at && new Date(promo.expires_at).getTime() < Date.now();
              return (
                <tr key={promo.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 text-neutral-400 mr-2" />
                      <span className="text-sm font-mono font-bold text-indigo-600">{promo.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900 font-medium">
                      {promo.discount_type === 'percentage' ? `${promo.discount_amount}% OFF` : `$${promo.discount_amount} OFF`}
                    </div>
                    {promo.is_stripe_coupon && (
                      <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> Stripe Integrated
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {promo.times_used} / {promo.max_uses || '∞'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx(
                      "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                      !promo.is_active ? "bg-neutral-100 text-neutral-800" :
                      isExpired ? "bg-red-100 text-red-800" :
                      "bg-green-100 text-green-800"
                    )}>
                      {!promo.is_active ? 'Disabled' : isExpired ? 'Expired' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => toggleStatus(promo.id, promo.is_active)}
                      className={clsx(
                        "text-xs px-3 py-1.5 rounded flex items-center gap-1.5 ml-auto border",
                        promo.is_active ? "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100" : "text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
                      )}
                      title={promo.is_active ? 'Disable' : 'Enable'}
                    >
                      {promo.is_active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                      {promo.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => deletePromo(promo.id)}
                      className="text-neutral-500 hover:text-red-600 p-1 mt-2 flex items-center gap-1 text-xs justify-end w-full"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {promos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-neutral-500">
                  No promo codes have been created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
