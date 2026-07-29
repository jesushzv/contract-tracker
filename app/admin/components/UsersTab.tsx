'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function UsersTab() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const json = await res.json();
          setUsers(json.users || []);
        } else {
          setError(`Error ${res.status}: ${res.statusText}`);
        }
      } catch (err) {
        setError('Network error or failed to load data');
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-900">User Directory</h2>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:placeholder-neutral-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-neutral-200">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : error || !users ? (
          <div className="py-12 flex justify-center text-red-500 bg-red-50 rounded-lg p-4 border border-red-200">
            Failed to load users: {error || 'Missing data'}. Did you run the database migrations?
          </div>
        ) : (
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Tier
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Contracts
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  RFC
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{user.fullName || 'No Name'}</div>
                        <div className="text-sm text-neutral-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.tier === 'pro' ? 'bg-purple-100 text-purple-800' :
                      user.tier === 'starter' ? 'bg-blue-100 text-blue-800' :
                      'bg-neutral-100 text-neutral-800'
                    }`}>
                      {user.tier || 'free'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {user.contractCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {user.rfc || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-neutral-500">
                    No users found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden shadow-xl border border-neutral-200 text-left">
            {/* Modal Header */}
            <div className="bg-neutral-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">User Details</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-neutral-400 hover:text-white transition-colors focus:outline-none text-xl"
              >
                ✕
              </button>
            </div>
            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">User ID</span>
                <span className="text-sm font-mono break-all text-neutral-800">{selectedUser.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Full Name</span>
                  <span className="text-sm font-medium text-neutral-900">{selectedUser.fullName || 'No Name'}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Email Address</span>
                  <span className="text-sm font-medium text-neutral-900 break-all">{selectedUser.email}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Subscription Tier</span>
                  <div>
                    <span className={`inline-flex px-2 mt-1 text-xs leading-5 font-semibold rounded-full ${
                      selectedUser.tier === 'pro' ? 'bg-purple-100 text-purple-800' :
                      selectedUser.tier === 'starter' ? 'bg-blue-100 text-blue-800' :
                      'bg-neutral-100 text-neutral-800'
                    }`}>
                      {selectedUser.tier || 'free'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">RFC</span>
                  <span className="text-sm font-mono text-neutral-900">{selectedUser.rfc || 'Not Registered'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Phone Number</span>
                  <span className="text-sm text-neutral-900">{selectedUser.phone || 'Not Registered'}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Contracts Created</span>
                  <span className="text-sm font-medium text-neutral-900">{selectedUser.contractCount}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Registration Date</span>
                <span className="text-sm text-neutral-900">
                  {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('es-MX') : 'N/A'}
                </span>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="bg-neutral-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded font-medium text-sm transition-colors focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
