import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';
import { Coins, ArrowRight, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Following the memory about token_economy schema within main Supabase instance
interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface TokenProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  available: boolean;
}

const TokenEconomy: React.FC = () => {
  const { currentUser, setCurrentUser } = useUser();
  
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [products, setProducts] = useState<TokenProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('wallet');
  
  // Define token economy schema
  const tokenEconomySchema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';
  
  // Load token transactions and products
  useEffect(() => {
    const loadTokenData = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        
        // Load transactions from token_economy schema
        const { data: transactionsData, error: transactionsError } = await supabase
          .schema(tokenEconomySchema)
          .from('transactions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (transactionsError) throw transactionsError;
        
        // Load available token products
        const { data: productsData, error: productsError } = await supabase
          .schema(tokenEconomySchema)
          .from('products')
          .select('*')
          .eq('available', true);
        
        if (productsError) throw productsError;
        
        setTransactions(transactionsData || []);
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error loading token data:', error);
        toast.error('Failed to load token data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTokenData();
  }, [currentUser]);
  
  // Purchase a product with tokens
  const handlePurchase = async (product: TokenProduct) => {
    if (!currentUser) return;
    
    if ((currentUser.tokens ?? 0) < product.price) {
      toast.error('Insufficient tokens');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Begin a transaction
      const { error: purchaseError } = await supabase
        .schema(tokenEconomySchema)
        .rpc('purchase_product', {
        user_id: currentUser.id,
        product_id: product.id,
        amount: product.price
      });
      
      if (purchaseError) throw purchaseError;
      
      // Update user's token balance locally
      setCurrentUser({
        ...currentUser,
        tokens: (currentUser.tokens ?? 0) - product.price
      });
      
      // Add to transactions
      const newTransaction: TokenTransaction = {
        id: Date.now().toString(),
        user_id: currentUser.id,
        amount: -product.price,
        type: 'purchase',
        description: `Purchased ${product.name}`,
        created_at: new Date().toISOString()
      };
      
      setTransactions([newTransaction, ...transactions]);
      
      toast.success(`Successfully purchased ${product.name}!`);
    } catch (error) {
      console.error('Error purchasing product:', error);
      toast.error('Failed to complete purchase');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send tokens to another user
  const handleSendTokens = async (recipientId: string, amount: number) => {
    if (!currentUser) return;
    
    if ((currentUser.tokens ?? 0) < amount) {
      toast.error('Insufficient tokens');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Transfer tokens using token_economy schema function
      const { error: transferError } = await supabase
        .schema(tokenEconomySchema)
        .rpc('transfer_tokens', {
        sender_id: currentUser.id,
        recipient_id: recipientId,
        amount: amount
      });
      
      if (transferError) throw transferError;
      
      // Update user's token balance locally
      setCurrentUser({
        ...currentUser,
        tokens: (currentUser.tokens ?? 0) - amount
      });
      
      // Add to transactions
      const newTransaction: TokenTransaction = {
        id: Date.now().toString(),
        user_id: currentUser.id,
        amount: -amount,
        type: 'transfer',
        description: `Sent tokens to user`,
        created_at: new Date().toISOString()
      };
      
      setTransactions([newTransaction, ...transactions]);
      
      toast.success(`Successfully sent ${amount} tokens!`);
    } catch (error) {
      console.error('Error sending tokens:', error);
      toast.error('Failed to send tokens');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderWallet = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h3 className="text-lg font-medium mb-2">Token Balance</h3>
        <div className="flex items-center">
          <Coins className="w-8 h-8 mr-2" />
          <span className="text-3xl font-bold">{currentUser?.tokens || 0}</span>
        </div>
        <p className="mt-2 text-blue-100">Use tokens for premium features and rewards</p>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-3">Recent Transactions</h3>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center py-4 text-gray-500">No recent transactions</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(transaction => (
              <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.created_at).toLocaleString()}
                  </p>
                </div>
                <div className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => setActiveTab('send')}
          className="flex items-center justify-center w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Send Tokens
        </button>
      </div>
    </div>
  );
  
  const renderStore = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Token Store</h3>
        <div className="flex items-center bg-blue-100 px-3 py-1 rounded-full text-blue-800">
          <Coins className="w-4 h-4 mr-1" />
          <span className="font-bold">{currentUser?.tokens || 0}</span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : products.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No products available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(product => (
            <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {product.image_url && (
                <img 
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <h4 className="font-bold">{product.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-blue-600 font-bold">
                    <Coins className="w-4 h-4 mr-1" />
                    {product.price}
                  </div>
                  <button
                    onClick={() => handlePurchase(product)}
                    disabled={!currentUser || (currentUser.tokens ?? 0) < product.price}
                    className={`px-3 py-1 rounded ${
                      !currentUser || (currentUser.tokens ?? 0) < product.price
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {!currentUser || (currentUser.tokens ?? 0) < product.price ? 'Not enough tokens' : 'Purchase'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  const renderSend = () => {
    const [recipient, setRecipient] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!recipient || amount <= 0) return;
      
      handleSendTokens(recipient, amount);
      setRecipient('');
      setAmount(0);
      setActiveTab('wallet');
    };
    
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => setActiveTab('wallet')}
            className="mr-2 text-blue-500 hover:text-blue-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-medium">Send Tokens</h3>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="flex justify-between">
            <span className="text-blue-700">Available Balance:</span>
            <span className="font-bold">{currentUser?.tokens || 0} tokens</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient User ID
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter recipient user ID"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value)))}
              className="w-full p-2 border border-gray-300 rounded"
              min="1"
              max={currentUser?.tokens || 0}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={!recipient || amount <= 0 || amount > (currentUser?.tokens || 0)}
            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Send Tokens
          </button>
        </form>
      </div>
    );
  };
  
  const renderEarn = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-3">Ways to Earn Tokens</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
            <h4 className="font-bold">Daily Activity</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">Sign in every day to earn tokens</p>
          <div className="text-green-600 font-medium">+5 tokens</div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <MessageIcon className="w-5 h-5 text-green-500 mr-2" />
            <h4 className="font-bold">Create Content</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">Post new content to earn tokens</p>
          <div className="text-green-600 font-medium">+10 tokens</div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Users className="w-5 h-5 text-green-500 mr-2" />
            <h4 className="font-bold">Invite Friends</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">Earn tokens for each new user you invite</p>
          <div className="text-green-600 font-medium">+20 tokens</div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <MapPin className="w-5 h-5 text-green-500 mr-2" />
            <h4 className="font-bold">Check In</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">Check in at locations to earn tokens</p>
          <div className="text-green-600 font-medium">+15 tokens</div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Token Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-4 py-2 ${
            activeTab === 'wallet' 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Wallet
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 ${
            activeTab === 'store' 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Store
        </button>
        <button
          onClick={() => setActiveTab('earn')}
          className={`px-4 py-2 ${
            activeTab === 'earn' 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Earn
        </button>
      </div>
      
      {/* Content based on active tab */}
      {activeTab === 'wallet' && renderWallet()}
      {activeTab === 'store' && renderStore()}
      {activeTab === 'send' && renderSend()}
      {activeTab === 'earn' && renderEarn()}
    </div>
  );
};

// MessageIcon component (since we don't have the import)
const MessageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Users component (since we don't have the import)
const Users: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// MapPin component (since we don't have the import)
const MapPin: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// ArrowLeft component (since we don't have the import)
const ArrowLeft: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export default TokenEconomy;
