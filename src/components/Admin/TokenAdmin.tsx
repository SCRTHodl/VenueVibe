import React, { useEffect, useState } from 'react';
import { tokenService, type TokenTransaction, type TokenBalance } from '../../lib/tokenService';
import { supabase } from '../../lib/supabase';

// Interface for admin user display
interface AdminUserDisplay {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  tokenBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

const TokenAdmin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userBalances, setUserBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [users, setUsers] = useState<Record<string, AdminUserDisplay>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Grant tokens form state
  const [grantAmount, setGrantAmount] = useState(0);
  const [grantDescription, setGrantDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (error || !data) {
          window.location.href = '/access-denied';
          return false;
        }
        return true;
      } catch (e) {
        console.error('Failed to check admin status:', e);
        window.location.href = '/access-denied';
        return false;
      }
    };

    const loadTokenData = async () => {
      setIsLoading(true);
      try {
        const isAdmin = await checkAdminStatus();
        if (!isAdmin) return;

        // Load token balances and transactions
        const balances = await tokenService.getAllUserBalances();
        setUserBalances(balances);

        const txns = await tokenService.getAllTransactions(100);
        setTransactions(txns);
        
        // Extract unique user IDs
        const userIds = new Set<string>();
        balances.forEach(balance => userIds.add(balance.user_id));
        txns.forEach(tx => {
          userIds.add(tx.user_id);
          if (tx.recipient_id) userIds.add(tx.recipient_id);
        });
        
        // Fetch user details
        if (userIds.size > 0) {
          const { data: usersData, error } = await supabase
            .from('users')
            .select('id, email, username, avatar_url')
            .in('id', Array.from(userIds));
            
          if (!error && usersData) {
            const userMap: Record<string, AdminUserDisplay> = {};
            usersData.forEach(user => {
              const userBalance = balances.find(b => b.user_id === user.id);
              userMap[user.id] = {
                ...user,
                tokenBalance: userBalance?.balance || 0,
                lifetimeEarned: userBalance?.lifetime_earned || 0,
                lifetimeSpent: userBalance?.lifetime_spent || 0
              };
            });
            setUsers(userMap);
          }
        }
      } catch (err) {
        console.error('Error loading admin token data:', err);
        setError('Failed to load token data');
      } finally {
        setIsLoading(false);
      }
    };

    loadTokenData();
  }, []);

  // Grant tokens to a user
  const handleGrantTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    if (grantAmount <= 0) {
      setError('Grant amount must be greater than 0');
      return;
    }

    try {
      // Call supabase RPC function directly as admin
      const { data, error } = await supabase.rpc('token_economy.earn_tokens', {
        p_user_id: selectedUserId,
        p_amount: grantAmount,
        p_action: 'admin_grant',
        p_reference_id: null,
        p_description: grantDescription || 'Administrative token grant'
      });

      if (error) {
        throw error;
      }

      setSuccess(`Successfully granted ${grantAmount} tokens to user.`);
      
      // Refresh data
      const balances = await tokenService.getAllUserBalances();
      setUserBalances(balances);
      const txns = await tokenService.getAllTransactions(100);
      setTransactions(txns);
      
      // Update local user data
      setUsers(prev => {
        const updated = { ...prev };
        if (updated[selectedUserId]) {
          updated[selectedUserId] = {
            ...updated[selectedUserId],
            tokenBalance: (updated[selectedUserId].tokenBalance || 0) + grantAmount,
            lifetimeEarned: (updated[selectedUserId].lifetimeEarned || 0) + grantAmount
          };
        }
        return updated;
      });
      
      // Reset form
      setGrantAmount(0);
      setGrantDescription('');
    } catch (err) {
      console.error('Error granting tokens:', err);
      setError('Failed to grant tokens. Please try again.');
    }
  };

  // Format date to a readable string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get user display name
  const getUserDisplay = (userId: string): string => {
    const user = users[userId];
    if (!user) return userId.substring(0, 8) + '...';
    return user.username || user.email || userId.substring(0, 8) + '...';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Token Economy Administration</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Stats */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium">Token Statistics</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800">Total Users</h3>
                  <p className="text-2xl font-bold">{userBalances.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-800">Total Tokens Issued</h3>
                  <p className="text-2xl font-bold">
                    {userBalances.reduce((sum, user) => sum + (user.lifetime_earned || 0), 0)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-purple-800">Total Tokens Spent</h3>
                  <p className="text-2xl font-bold">
                    {userBalances.reduce((sum, user) => sum + (user.lifetime_spent || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* User Balances */}
          <div className="bg-white rounded-lg shadow mt-6 overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium">User Token Balances</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Earned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userBalances.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No user balances found
                      </td>
                    </tr>
                  ) : (
                    userBalances.map(balance => (
                      <tr key={balance.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              {users[balance.user_id]?.avatar_url ? (
                                <img
                                  className="h-8 w-8 rounded-full"
                                  src={users[balance.user_id].avatar_url}
                                  alt=""
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                  {getUserDisplay(balance.user_id).charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {getUserDisplay(balance.user_id)}
                              </div>
                              <div className="text-xs text-gray-500">{balance.user_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {balance.balance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {balance.lifetime_earned}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {balance.lifetime_spent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedUserId(balance.user_id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Grant Tokens Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Grant Tokens</h2>
            <form onSubmit={handleGrantTokens}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selected User
                </label>
                {selectedUserId ? (
                  <div className="p-2 bg-gray-50 border rounded flex justify-between items-center">
                    <div>
                      <div className="font-medium">{getUserDisplay(selectedUserId)}</div>
                      <div className="text-xs text-gray-500">{selectedUserId}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(null)}
                      className="text-sm text-red-600"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="p-2 bg-gray-50 border rounded text-gray-500">
                    No user selected
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  value={grantAmount || ''}
                  onChange={e => setGrantAmount(parseInt(e.target.value) || 0)}
                  min="1"
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  value={grantDescription}
                  onChange={e => setGrantDescription(e.target.value)}
                  placeholder="Reason for granting tokens"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <button
                type="submit"
                disabled={!selectedUserId || grantAmount <= 0}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300"
              >
                Grant Tokens
              </button>
            </form>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                type="button"
                className="w-full flex justify-between items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => window.location.href = '/admin/token-settings'}
              >
                <span>Token Settings</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                type="button"
                className="w-full flex justify-between items-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => window.location.href = '/admin/token-reports'}
              >
                <span>Token Reports</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow mt-6 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${tx.transaction_type === 'earn' ? 'bg-green-100 text-green-800' : 
                            tx.transaction_type === 'spend' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'}`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getUserDisplay(tx.user_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.recipient_id ? getUserDisplay(tx.recipient_id) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {tx.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TokenAdmin;
