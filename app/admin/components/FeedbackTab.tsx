'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Loader2, CheckCircle, Clock, Archive } from 'lucide-react';
import { UserFeedback } from '@/lib/types';
import clsx from 'clsx';

export default function FeedbackTab() {
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<UserFeedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/feedback');
        if (res.ok) {
          const data = await res.json();
          setFeedback(data.feedback);
        }
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: data.feedback.status } : f));
        if (selectedItem && selectedItem.id === id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setSelectedItem({ ...selectedItem, status: data.feedback.status as any });
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleReply = async () => {
    if (!selectedItem || !replyText) return;
    
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedItem.id, 
          status: 'resolved',
          adminReply: replyText 
        })
      });
      if (res.ok) {
        await res.json();
        setFeedback(prev => prev.map(f => f.id === selectedItem.id ? { 
          ...f, 
          status: 'resolved',
          adminReply: replyText,
          replied_at: new Date().toISOString()
        } : f));
        setSelectedItem(null);
        setReplyText('');
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">New</span>;
      case 'in-progress': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">In Progress</span>;
      case 'resolved': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Resolved</span>;
      case 'archived': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-800">Archived</span>;
      default: return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bug': return 'text-red-600 bg-red-50';
      case 'feature-request': return 'text-purple-600 bg-purple-50';
      case 'billing': return 'text-orange-600 bg-orange-50';
      default: return 'text-indigo-600 bg-indigo-50';
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
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-12rem)]">
      {/* Inbox List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <h2 className="font-semibold text-neutral-800">Inbox</h2>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">
            {feedback.filter(f => f.status === 'new').length} new
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {feedback.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-sm">
              No feedback found
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {feedback.map(item => (
                <li 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  className={clsx(
                    "p-4 hover:bg-indigo-50 cursor-pointer transition-colors",
                    selectedItem?.id === item.id ? "bg-indigo-50 border-l-4 border-indigo-500" : "border-l-4 border-transparent"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={clsx("text-xs font-medium px-2 py-0.5 rounded", getCategoryColor(item.category))}>
                      {item.category}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 truncate">{item.subject}</h3>
                  <p className="text-sm text-neutral-500 truncate mt-1">{item.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-600">{item.userEmail || 'Unknown User'}</span>
                    {getStatusBadge(item.status)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Detail/Reply Panel */}
      <div className="w-full md:w-2/3 flex flex-col bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {selectedItem ? (
          <>
            <div className="p-6 border-b border-neutral-200 flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className={clsx("text-xs font-medium px-2 py-1 rounded uppercase tracking-wide", getCategoryColor(selectedItem.category))}>
                    {selectedItem.category.replace('-', ' ')}
                  </span>
                  {getStatusBadge(selectedItem.status)}
                </div>
                <h2 className="text-xl font-bold text-neutral-900">{selectedItem.subject}</h2>
                <div className="text-sm text-neutral-500 mt-1">
                  From: <span className="font-medium text-neutral-700">{selectedItem.userEmail}</span> • {new Date(selectedItem.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex space-x-2">
                {selectedItem.status !== 'in-progress' && (
                  <button 
                    onClick={() => handleStatusUpdate(selectedItem.id, 'in-progress')}
                    disabled={updating}
                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded" title="Mark In Progress"
                  >
                    <Clock className="h-5 w-5" />
                  </button>
                )}
                {selectedItem.status !== 'resolved' && (
                  <button 
                    onClick={() => handleStatusUpdate(selectedItem.id, 'resolved')}
                    disabled={updating}
                    className="p-2 text-green-600 hover:bg-green-50 rounded" title="Mark Resolved"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>
                )}
                {selectedItem.status !== 'archived' && (
                  <button 
                    onClick={() => handleStatusUpdate(selectedItem.id, 'archived')}
                    disabled={updating}
                    className="p-2 text-neutral-600 hover:bg-neutral-100 rounded" title="Archive"
                  >
                    <Archive className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="bg-neutral-50 rounded-lg p-4 text-neutral-800 whitespace-pre-wrap text-sm mb-6 border border-neutral-100">
                {selectedItem.message}
              </div>

              {selectedItem.adminReply ? (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 mb-2">Admin Reply</h4>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-indigo-900 whitespace-pre-wrap text-sm">
                    {selectedItem.adminReply}
                  </div>
                  <div className="text-xs text-neutral-400 mt-2">
                    Replied at {selectedItem.replied_at ? new Date(selectedItem.replied_at).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              ) : (
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-neutral-900 mb-2">Write a Reply</h4>
                  <p className="text-xs text-neutral-500 mb-3">
                    Note: We will eventually hook this up to send an email via Resend from a custom domain.
                  </p>
                  <textarea
                    rows={5}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Type your response here..."
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleReply}
                      disabled={updating || !replyText.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {updating ? 'Sending...' : 'Send Reply & Resolve'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400 flex-col">
            <MessageSquare className="h-12 w-12 mb-4 text-neutral-300" />
            <p>Select a message to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
