'use client';

import { useState, useEffect } from 'react';
import { Mail, Loader2, Send, Clock } from 'lucide-react';
import { EmailCampaign } from '@/lib/types';
import clsx from 'clsx';

export default function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('all');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/campaigns');
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns);
        }
      } catch (error) {
        console.error('Failed to fetch campaigns', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setCreating(true);
    
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject,
          content,
          target_audience: audience
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save campaign');
      }
      
      setCampaigns([data.campaign, ...campaigns]);
      setShowCreate(false);
      setName('');
      setSubject('');
      setContent('');
      setAudience('all');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Are you sure you want to send this campaign now? This action cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'send' })
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(campaigns.map(c => c.id === id ? data.campaign : c));
        alert(`Campaign sent to ${data.campaign.sent_count} users successfully!`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send campaign');
      }
    } catch (error) {
      console.error('Failed to send campaign:', error);
      alert('Network error while sending campaign.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Email Campaigns</h2>
          <p className="text-sm text-neutral-500">Send announcements, product updates, and promotions to your users.</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors"
        >
          {showCreate ? 'Cancel' : <><Mail className="h-4 w-4" /> Draft New Campaign</>}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-neutral-900">Draft New Campaign</h3>
            <button 
              onClick={() => setPreviewMode(!previewMode)}
              className="text-xs font-medium text-purple-600 hover:text-purple-800 bg-purple-50 px-2 py-1 rounded"
            >
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
          </div>
          
          {previewMode ? (
            <div className="border border-neutral-200 rounded-md p-8 bg-neutral-50 flex justify-center">
              <div className="bg-white border border-neutral-200 shadow-sm p-8 max-w-[600px] w-full rounded">
                <h1 className="text-2xl font-normal text-center mb-6 text-neutral-800">{subject || 'Subject Line'}</h1>
                <div className="whitespace-pre-wrap text-neutral-700 leading-relaxed text-sm">
                  {content || 'Email content will appear here.'}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Internal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Sale 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Target Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md p-2 text-sm"
                  >
                    <option value="all">All Registered Users</option>
                    <option value="free">Free Users Only</option>
                    <option value="starter">Starter Plan Users Only</option>
                    <option value="pro">Pro Plan Users Only</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Subject Line</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Big updates to Mi Pacto!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-neutral-300 rounded-md p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Email Content (Plain Text / Markdown)</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Type your message here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-neutral-300 rounded-md p-2 text-sm resize-none"
                />
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
                  className="bg-neutral-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-900 disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Save as Draft'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-neutral-200">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Campaign</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Audience</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Sent Count</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-neutral-900">{campaign.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5 truncate max-w-[250px]">{campaign.subject}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                    campaign.target_audience === 'all' ? "bg-purple-100 text-purple-800" : "bg-purple-100 text-purple-800"
                  )}>
                    {campaign.target_audience.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    "flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md",
                    campaign.status === 'sent' ? "text-green-700 bg-green-50 border border-green-200" : "text-amber-700 bg-amber-50 border border-amber-200"
                  )}>
                    {campaign.status === 'sent' ? <Mail className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {campaign.status === 'sent' ? 'Sent' : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                  {campaign.status === 'sent' ? campaign.sent_count : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {campaign.status === 'draft' && (
                    <button 
                      onClick={() => handleSend(campaign.id)}
                      className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded flex items-center gap-1.5 ml-auto text-xs"
                    >
                      <Send className="h-3 w-3" /> Send Now
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-neutral-500">
                  No email campaigns have been created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
