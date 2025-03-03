import React, { useState, useEffect } from 'react';
import { Coins, Clock, Plus, ChevronRight, ArrowUp, ArrowDown, BarChart3, Star, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenStore, TOKEN_ECONOMY, Transaction } from '../../lib/tokenStore';
import { formatTimeAgo } from '../../lib/utils';

interface TokenWalletProps {
  onClose?: () => void;
}

export const TokenWallet: React.FC<TokenWalletProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'wallet' | 'store' | 'earn'>('wallet');
  const [isConfirmingPurchase, setIsConfirmingPurchase] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Get token state from store
  const { 
    balance, 
    totalEarned, 
    totalSpent, 
    transactions, 
    isInitialized,
    isLoading,
    initializeWallet,
    earnTokens,
    spendTokens,
    purchaseTokens,
    getTransactionHistory
  } = useTokenStore();
  
  // Initialize wallet on component mount
  useEffect(() => {
    if (!isInitialized) {
      initializeWallet();
    } else {
      // Refresh transaction history on mount
      getTransactionHistory();
    }
  }, [isInitialized, initializeWallet, getTransactionHistory]);
  
  // Handle token package purchase
  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    setIsConfirmingPurchase(true);
  };
  
  // Confirm token purchase
  const confirmPurchase = async () => {
    if (!selectedPackage) return;
    
    const success = await purchaseTokens(selectedPackage);
    
    if (success) {
      const pkg = TOKEN_ECONOMY.PACKAGES.find(p => p.id === selectedPackage);
      if (pkg) {
        setSuccessMessage(`Successfully purchased ${pkg.amount + pkg.bonus} tokens!`);
        setShowSuccessMessage(true);
        
        // Hide success message after a few seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }
    }
    
    setIsConfirmingPurchase(false);
    setSelectedPackage(null);
  };
  
  // Handle token earning option
  const handleEarnOption = async (amount: number, reason: string) => {
    const success = await earnTokens(amount, reason);
    
    if (success) {
      setSuccessMessage(`You earned ${amount} tokens!`);
      setShowSuccessMessage(true);
      
      // Hide success message after a few seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  };
  
  // Format transaction amount with color based on type
  const formatAmount = (transaction: Transaction) => {
    const amount = Math.abs(transaction.amount);
    const isPositive = transaction.amount > 0;
    
    return (
      <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
        {isPositive ? '+' : '-'}{amount}
      </span>
    );
  };
  
  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'wallet':
        return (
          <div className="space-y-4">
            {/* Balance card */}
            <div className="bg-gradient-to-r from-[--color-accent-primary]/20 to-[--color-accent-secondary]/20 rounded-xl p-4 border border-[--color-accent-primary]/10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-400">Current Balance</div>
                <div className="w-10 h-10 rounded-full bg-[--color-accent-primary]/20 flex items-center justify-center">
                  <Coins size={20} className="text-[--color-accent-primary]" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{balance} Tokens</div>
              <div className="flex justify-between mt-4 text-xs text-gray-400">
                <div>Total Earned: {totalEarned}</div>
                <div>Total Spent: {totalSpent}</div>
              </div>
            </div>
            
            {/* Transaction history */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">Recent Transactions</h3>
                <button className="text-[--color-accent-primary] text-sm flex items-center">
                  View All <ChevronRight size={14} />
                </button>
              </div>
              
              {transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="bg-[#1a2234] rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'earn' 
                            ? 'bg-green-500/20' 
                            : transaction.type === 'spend'
                            ? 'bg-red-500/20'
                            : 'bg-blue-500/20'
                        }`}>
                          {transaction.type === 'earn' && <ArrowUp size={16} className="text-green-400" />}
                          {transaction.type === 'spend' && <ArrowDown size={16} className="text-red-400" />}
                          {transaction.type === 'purchase' && <Plus size={16} className="text-blue-400" />}
                        </div>
                        <div>
                          <div className="text-sm text-white">{transaction.reason}</div>
                          <div className="text-xs text-gray-400">{formatTimeAgo(new Date(transaction.timestamp))}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatAmount(transaction)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#1a2234] rounded-lg p-4 text-center">
                  <p className="text-gray-400 text-sm">No transactions yet</p>
                </div>
              )}
            </div>
            
            {/* Token usage stats */}
            <div className="bg-[#1a2234] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-[--color-accent-primary]" />
                <h3 className="text-white font-medium">Token Usage</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Stories viewed</span>
                  <span className="text-white">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Messages sent</span>
                  <span className="text-white">27</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Badges unlocked</span>
                  <span className="text-white">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Events joined</span>
                  <span className="text-white">5</span>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'store':
        return (
          <div className="space-y-4">
            {/* Current balance */}
            <div className="bg-[#1a2234] rounded-lg p-3 flex items-center justify-between">
              <div className="text-white">Current Balance</div>
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-[--color-accent-primary]" />
                <span className="font-medium text-white">{balance} Tokens</span>
              </div>
            </div>
            
            {/* Token packages */}
            <div className="space-y-3">
              {TOKEN_ECONOMY.PACKAGES.map((pkg) => (
                <div key={pkg.id} className="bg-[#1a2234] rounded-lg p-4 border border-[--color-accent-primary]/10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium">{pkg.name}</div>
                      <div className="text-sm text-gray-400">${pkg.price}</div>
                    </div>
                    <div className="px-2 py-1 rounded-lg bg-[--color-accent-primary]/20 text-[--color-accent-primary] text-sm">
                      {pkg.amount} Tokens
                    </div>
                  </div>
                  
                  {pkg.bonus > 0 && (
                    <div className="text-sm text-green-400 mb-2">+ {pkg.bonus} bonus tokens!</div>
                  )}
                  
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    className="w-full bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Purchase
                  </button>
                </div>
              ))}
            </div>
            
            {/* Subscription option */}
            <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="text-yellow-400" />
                <div className="text-white font-medium">Premium Subscription</div>
              </div>
              <div className="text-sm text-gray-300 mb-3">
                Get 500 tokens monthly plus exclusive premium features
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-300">$19.99 / month</div>
                <div className="text-white text-sm font-medium">Save 33%</div>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        );
        
      case 'earn':
        return (
          <div className="space-y-4">
            {/* Current balance */}
            <div className="bg-[#1a2234] rounded-lg p-3 flex items-center justify-between">
              <div className="text-white">Current Balance</div>
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-[--color-accent-primary]" />
                <span className="font-medium text-white">{balance} Tokens</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-300 mb-2">
              Complete these actions to earn tokens:
            </div>
            
            {/* Earning options */}
            <div className="space-y-3">
              <div className="bg-[#1a2234] rounded-lg p-4 border border-green-500/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-green-500/20">
                      <MapPin size={16} className="text-green-400" />
                    </div>
                    <div className="text-white">Check in at location</div>
                  </div>
                  <div className="text-green-400 font-medium">+{TOKEN_ECONOMY.REWARDS.CHECK_IN}</div>
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  Earn tokens by checking in at participating venues
                </div>
                <button
                  onClick={() => handleEarnOption(TOKEN_ECONOMY.REWARDS.CHECK_IN, 'Location check-in')}
                  className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Check In Now
                </button>
              </div>
              
              <div className="bg-[#1a2234] rounded-lg p-4 border border-blue-500/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-blue-500/20">
                      <Calendar size={16} className="text-blue-400" />
                    </div>
                    <div className="text-white">Attend event</div>
                  </div>
                  <div className="text-blue-400 font-medium">+{TOKEN_ECONOMY.REWARDS.ATTEND_EVENT}</div>
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  Earn tokens by attending special events
                </div>
                <button
                  onClick={() => handleEarnOption(TOKEN_ECONOMY.REWARDS.ATTEND_EVENT, 'Event attendance')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  View Events
                </button>
              </div>
              
              <div className="bg-[#1a2234] rounded-lg p-4 border border-purple-500/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-purple-500/20">
                      <Share2 size={16} className="text-purple-400" />
                    </div>
                    <div className="text-white">Invite friends</div>
                  </div>
                  <div className="text-purple-400 font-medium">+{TOKEN_ECONOMY.REWARDS.INVITE_FRIEND}</div>
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  Earn tokens for each friend who joins MapChat
                </div>
                <button
                  onClick={() => handleEarnOption(TOKEN_ECONOMY.REWARDS.INVITE_FRIEND, 'Friend invitation')}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Invite Friends
                </button>
              </div>
              
              <div className="bg-[#1a2234] rounded-lg p-4 border border-orange-500/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-orange-500/20">
                      <Trophy size={16} className="text-orange-400" />
                    </div>
                    <div className="text-white">Complete challenges</div>
                  </div>
                  <div className="text-orange-400 font-medium">+{TOKEN_ECONOMY.REWARDS.COMPLETE_CHALLENGE}</div>
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  Earn tokens by completing special challenges
                </div>
                <button
                  onClick={() => handleEarnOption(TOKEN_ECONOMY.REWARDS.COMPLETE_CHALLENGE, 'Challenge completion')}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  View Challenges
                </button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Confirmation dialog for purchases
  const renderConfirmationDialog = () => {
    if (!selectedPackage) return null;
    
    const pkg = TOKEN_ECONOMY.PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg) return null;
    
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
        <div className="w-full max-w-sm bg-[#1a2234] rounded-lg p-4 border border-[--color-accent-primary]/20">
          <h3 className="text-white font-semibold mb-4 text-center">Confirm Purchase</h3>
          
          <div className="bg-[#121826] rounded-lg p-4 mb-4 border border-[--color-accent-primary]/10">
            <div className="text-center mb-3">
              <div className="text-lg font-medium text-white">{pkg.name}</div>
              <div className="text-gray-400">${pkg.price}</div>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <div className="text-gray-300">Tokens</div>
              <div className="text-white">{pkg.amount}</div>
            </div>
            
            {pkg.bonus > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <div className="text-gray-300">Bonus tokens</div>
                <div className="text-green-400">+{pkg.bonus}</div>
              </div>
            )}
            
            <div className="flex justify-between items-center py-2 mt-2">
              <div className="text-white font-medium">Total</div>
              <div className="text-white font-medium">{pkg.amount + pkg.bonus} tokens</div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setIsConfirmingPurchase(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmPurchase}
              className="flex-1 bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Success message toast
  const renderSuccessMessage = () => {
    return (
      <motion.div
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[60] bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className="bg-[#121826] rounded-lg shadow-xl border border-[--color-accent-primary]/10 overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[--color-accent-primary]/20 to-[--color-accent-secondary]/20 p-4 flex items-center justify-between border-b border-[--color-accent-primary]/10">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Coins size={20} className="text-[--color-accent-primary]" />
          Token Wallet
        </h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-[--color-accent-primary]/10">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'wallet' 
              ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' 
              : 'text-gray-400'
          }`}
        >
          Wallet
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'store' 
              ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' 
              : 'text-gray-400'
          }`}
        >
          Buy Tokens
        </button>
        <button
          onClick={() => setActiveTab('earn')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'earn' 
              ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' 
              : 'text-gray-400'
          }`}
        >
          Earn Tokens
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-accent-primary]"></div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
      
      {/* Purchase confirmation dialog */}
      {isConfirmingPurchase && renderConfirmationDialog()}
      
      {/* Success message toast */}
      <AnimatePresence>
        {showSuccessMessage && renderSuccessMessage()}
      </AnimatePresence>
    </div>
  );
};

// Missing icon imports
import { Trophy, CheckCircle, Share2 } from 'lucide-react';