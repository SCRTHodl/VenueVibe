import React, { useEffect, useState } from 'react';
import { tokenService, type TokenTransaction, type UserTokenData } from '../lib/tokenService';

interface TokenDashboardProps {
  userId?: string;
  isAdmin?: boolean;
}

const TokenDashboard: React.FC<TokenDashboardProps> = ({ userId, isAdmin = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserTokenData | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [transferAmount, setTransferAmount] = useState(0);
  const [recipientId, setRecipientId] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load user token data
        const data = await tokenService.getUserTokenData(userId);
        setUserData(data);

        // Load user transactions
        const txns = await tokenService.getMyTransactions();
        setTransactions(txns);
      } catch (err) {
        setError('Failed to load token data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const handleTransferTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!recipientId) {
      setError('Recipient ID is required');
      return;
    }

    if (transferAmount <= 0) {
      setError('Transfer amount must be greater than 0');
      return;
    }

    try {
      const newBalance = await tokenService.spendTokens(
        transferAmount,
        'token_transfer',
        recipientId,
        undefined,
        description || 'Token transfer'
      );

      if (newBalance !== null) {
        setSuccess(`Successfully transferred ${transferAmount} tokens. New balance: ${newBalance}`);
        
        // Refresh data
        const data = await tokenService.getUserTokenData(userId);
        setUserData(data);
        const txns = await tokenService.getMyTransactions();
        setTransactions(txns);
        
        // Clear form
        setTransferAmount(0);
        setRecipientId('');
        setDescription('');
      } else {
        setError('Transfer failed');
      }
    } catch (err) {
      setError('Transfer failed. Please check your balance and try again.');
      console.error(err);
    }
  };

  // Format date to a readable string
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-40">Loading token data...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Token Dashboard</h2>
      
      {/* Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <h3 className="text-lg font-medium text-blue-900 mb-1">Current Balance</h3>
          <div className="text-3xl font-bold text-blue-600">{userData?.balance || 0}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <h3 className="text-lg font-medium text-green-900 mb-1">Lifetime Earned</h3>
          <div className="text-3xl font-bold text-green-600">{userData?.lifetime_earned || 0}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <h3 className="text-lg font-medium text-purple-900 mb-1">Lifetime Spent</h3>
          <div className="text-3xl font-bold text-purple-600">{userData?.lifetime_spent || 0}</div>
        </div>
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Content Statistics</h3>
          <div className="flex justify-between">
            <div>
              <p className="text-gray-600">Stories Created</p>
              <p className="text-xl font-semibold">{userData?.stories_count || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">NFTs Owned</p>
              <p className="text-xl font-semibold">{userData?.nfts_count || 0}</p>
            </div>
          </div>
        </div>

        {/* Transfer Form */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Transfer Tokens</h3>
          <form onSubmit={handleTransferTokens}>
            {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-2">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 p-2 rounded mb-2">{success}</div>}
            
            <div className="mb-2">
              <label className="block text-sm text-gray-600 mb-1">Recipient ID</label>
              <input
                type="text"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="User ID to send tokens to"
                required
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-sm text-gray-600 mb-1">Amount</label>
              <input
                type="number"
                value={transferAmount || ''}
                onChange={(e) => setTransferAmount(parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded"
                min="1"
                required
              />
            </div>
            
            <div className="mb-2">
              <label className="block text-sm text-gray-600 mb-1">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Reason for transfer"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
              disabled={!userData || userData.balance < transferAmount}
            >
              Send Tokens
            </button>
          </form>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 px-3 text-center text-gray-500">No transactions found</td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-sm text-gray-500">{formatDate(tx.created_at)}</td>
                    <td className="py-2 px-3 text-sm">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full
                        ${tx.transaction_type === 'earn' ? 'bg-green-100 text-green-800' : 
                          tx.transaction_type === 'spend' ? 'bg-red-100 text-red-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-sm font-medium">
                      {tx.transaction_type === 'earn' ? '+' : '-'}{tx.amount}
                    </td>
                    <td className="py-2 px-3 text-sm text-gray-700">{tx.action}</td>
                    <td className="py-2 px-3 text-sm text-gray-500">{tx.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Admin Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-200"
              onClick={() => window.location.href = '/admin/tokens'}
            >
              View All User Balances
            </button>
            <button 
              className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-200"
              onClick={() => window.location.href = '/admin/transactions'}
            >
              View All Transactions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenDashboard;
