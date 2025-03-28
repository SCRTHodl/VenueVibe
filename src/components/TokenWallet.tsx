import React, { useEffect, useState } from 'react';
import { Wallet, ArrowRight, RefreshCw, X } from 'lucide-react';
import { tokenService, type TokenTransaction, type UserTokenData } from '../lib/tokenService';

interface TokenWalletProps {
  onClose: () => void;
}

export const TokenWallet: React.FC<TokenWalletProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserTokenData | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [view, setView] = useState<'overview' | 'send' | 'history'>('overview');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [recipientId, setRecipientId] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await tokenService.getUserTokenData();
        setUserData(data);
        
        const txns = await tokenService.getMyTransactions(10);
        setTransactions(txns);
      } catch (err) {
        console.error('Error loading token data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleSendTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!recipientId) {
      setError('Please enter a recipient ID');
      return;
    }
    
    if (!transferAmount || transferAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setIsLoading(true);
      const newBalance = await tokenService.spendTokens(
        transferAmount,
        'token_transfer',
        recipientId,
        undefined,
        transferNote || 'Token transfer'
      );
      
      if (newBalance !== null) {
        setSuccess(`Successfully sent ${transferAmount} tokens!`);
        setTransferAmount(0);
        setRecipientId('');
        setTransferNote('');
        
        // Refresh data
        const data = await tokenService.getUserTokenData();
        setUserData(data);
        const txns = await tokenService.getMyTransactions(10);
        setTransactions(txns);
        
        // Return to overview
        setTimeout(() => {
          setView('overview');
          setSuccess(null);
        }, 2000);
      } else {
        setError('Transfer failed. Please try again.');
      }
    } catch (err) {
      console.error('Error sending tokens:', err);
      setError('Failed to send tokens. Please check your balance and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWallet = async () => {
    setIsLoading(true);
    try {
      const data = await tokenService.getUserTokenData();
      setUserData(data);
      
      const txns = await tokenService.getMyTransactions(10);
      setTransactions(txns);
    } catch (err) {
      console.error('Error refreshing wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderOverview = () => (
    <>
      <div className="text-center py-6 px-4">
        <Wallet size={40} className="mx-auto mb-2 text-indigo-500" />
        <h3 className="text-xl font-semibold mb-1">Your Token Balance</h3>
        
        <div className="text-4xl font-bold my-4 flex items-center justify-center">
          <span className="text-indigo-500">{userData?.balance || 0}</span>
          <span className="ml-2 text-lg text-indigo-400/70">tokens</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-indigo-50 p-3 rounded-lg">
            <div className="text-sm text-indigo-600 mb-1">Earned</div>
            <div className="text-xl font-semibold">{userData?.lifetime_earned || 0}</div>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg">
            <div className="text-sm text-indigo-600 mb-1">Spent</div>
            <div className="text-xl font-semibold">{userData?.lifetime_spent || 0}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setView('send')}
            className="flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowRight size={16} />
            Send Tokens
          </button>
          <button
            onClick={() => setView('history')}
            className="flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
          >
            History
          </button>
        </div>
      </div>
      
      <div className="border-t pt-4 px-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Recent Activity</h4>
          <button 
            onClick={refreshWallet}
            className="text-indigo-600 p-1 hover:bg-indigo-50 rounded-full"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>No recent transactions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {tx.transaction_type === 'earn' ? 'Earned' : 'Spent'} {tx.amount} tokens
                    </div>
                    <div className="text-sm text-gray-500">{tx.action}</div>
                  </div>
                  <div className={`font-bold ${tx.transaction_type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.transaction_type === 'earn' ? '+' : '-'}{tx.amount}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatDate(tx.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderSendForm = () => (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => setView('overview')}
          className="mr-2 p-1 hover:bg-gray-100 rounded-full"
        >
          <ArrowRight size={16} className="transform rotate-180" />
        </button>
        <h3 className="text-lg font-semibold">Send Tokens</h3>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSendTokens}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient ID
          </label>
          <input
            type="text"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter user ID"
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={transferAmount || ''}
            onChange={(e) => setTransferAmount(parseInt(e.target.value) || 0)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0"
            min="1"
            max={userData?.balance || 0}
            disabled={isLoading}
            required
          />
          <div className="text-sm text-gray-500 mt-1">
            Available: {userData?.balance || 0} tokens
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={transferNote}
            onChange={(e) => setTransferNote(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Add a note"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300"
          disabled={isLoading || !transferAmount || transferAmount <= 0 || transferAmount > (userData?.balance || 0)}
        >
          {isLoading ? 'Processing...' : 'Send Tokens'}
        </button>
      </form>
    </div>
  );

  const renderHistory = () => (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => setView('overview')}
          className="mr-2 p-1 hover:bg-gray-100 rounded-full"
        >
          <ArrowRight size={16} className="transform rotate-180" />
        </button>
        <h3 className="text-lg font-semibold">Transaction History</h3>
      </div>
      
      {transactions.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p>No transaction history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">
                    {tx.transaction_type === 'earn' ? 'Earned' : 'Spent'} {tx.amount} tokens
                  </div>
                  <div className="text-sm text-gray-500">{tx.action}</div>
                  {tx.description && (
                    <div className="text-sm text-gray-500 mt-1">{tx.description}</div>
                  )}
                </div>
                <div className={`font-bold ${tx.transaction_type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.transaction_type === 'earn' ? '+' : '-'}{tx.amount}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {formatDate(tx.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden max-h-[80vh]">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Token Wallet</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>
      
      {isLoading && view === 'overview' ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {view === 'overview' && renderOverview()}
          {view === 'send' && renderSendForm()}
          {view === 'history' && renderHistory()}
        </>
      )}
    </div>
  );
};
