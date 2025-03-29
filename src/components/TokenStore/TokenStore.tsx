import React, { useState, useEffect } from 'react';
import { Store, Gift, Medal, Coins, Search, Filter, Tag, ChevronRight, X, Sparkles, ShoppingCart, Info, Clock, ArrowRight, Palette, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenStore } from '../../lib/tokenStore';
import { loadStripe } from '@stripe/stripe-js';
import { DigitalItemCard } from './DigitalItemCard';
import { ItemDetails } from './ItemDetails';
import { ContentRewards } from './ContentRewards';
import { Leaderboard } from '../Leaderboard/Leaderboard';
import { supabase } from '../../lib/supabase';

// Digital item type matching the database schema
export interface DigitalItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  item_type: 'nft' | 'gift' | 'badge' | 'theme';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  supply?: number;
  remaining?: number;
  transferable: boolean;
  created_at: string;
}

interface TokenStoreProps {
  onClose: () => void;
}

export const TokenStore: React.FC<TokenStoreProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'collection' | 'rewards' | 'leaderboard'>('shop');
  const [activeCategory, setActiveCategory] = useState<'all' | 'nft' | 'gift' | 'badge' | 'theme'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<DigitalItem | null>(null);
  const [items, setItems] = useState<DigitalItem[]>([]);
  const [ownedItems, setOwnedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'price-asc' | 'price-desc' | 'newest' | 'rarity' | 'featured'>('newest');
  const [cartItems, setCartItems] = useState<{item: DigitalItem, quantity: number}[]>([]);
  const [isConfirmingPurchase, setIsConfirmingPurchase] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Initialize Stripe with proper error handling
  const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  const stripePromise = stripePublicKey 
    ? loadStripe(stripePublicKey) 
    : Promise.reject(new Error('Stripe public key not found in environment variables'));

  // Get token store functions
  const { 
    balance, 
    earnTokens, 
    spendTokens, 
    purchaseTokens,
    isInitialized, 
    initializeWallet 
  } = useTokenStore();

  // Initialize wallet if needed
  useEffect(() => {
    if (!isInitialized) {
      initializeWallet();
    }
  }, [isInitialized, initializeWallet]);

  // Fetch items from database
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        // Use the tokenEconomySchema from environment variables
        const tokenEconomySchema = import.meta.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';
        
        // Properly access the token_economy schema
        const { data, error } = await supabase
          .schema(tokenEconomySchema)
          .from('digital_items')
          .select('*');
          
        if (error) throw error;
        
        if (data) {
          setItems(data as DigitalItem[]);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
        // Fallback to sample items if table doesn't exist yet
        setItems(SAMPLE_ITEMS);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchItems();
  }, []);

  // Filter items based on category and search
  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.item_type === activeCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Sort filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
    
    switch (sortOrder) {
      case 'featured':
        // Spring Training badge always first, then by rarity
        if (a.id === 'spring-training-2025') return -1;
        if (b.id === 'spring-training-2025') return 1;
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'rarity':
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      default:
        return 0;
    }
  });

  const handleAddToCart = (item: DigitalItem) => {
    const existingItem = cartItems.find(cartItem => cartItem.item.id === item.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(cartItem => 
        cartItem.item.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 } 
          : cartItem
      ));
    } else {
      setCartItems([...cartItems, { item, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(cartItem => cartItem.item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    
    setCartItems(cartItems.map(cartItem => 
      cartItem.item.id === itemId 
        ? { ...cartItem, quantity } 
        : cartItem
    ));
  };

  const getTotalCartPrice = () => {
    return cartItems.reduce((total, { item, quantity }) => total + (item.price * quantity), 0);
  };

  const handleCheckout = async () => {
    const totalPrice = getTotalCartPrice();
    
    if (balance < totalPrice) {
      alert('Not enough tokens! Please add more tokens to your wallet.');
      return;
    }
    
    try {
      const success = await spendTokens(totalPrice, 'Purchased items from store');
      
      if (success) {
        setCartItems([]);
        alert('Purchase successful! Items have been added to your collection.');
        setActiveTab('collection');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('An error occurred during checkout. Please try again.');
    }
  };

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
              onClick={handleConfirmPurchase}
              className="flex-1 bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  const handleConfirmPurchase = async () => {
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

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    setIsConfirmingPurchase(true);

    try {
      setIsProcessingPayment(true);
      
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const { data: { sessionId }, error } = await supabase
        .functions.invoke('create-checkout-session', {
          body: { packageId }
        });

      if (error) throw error;

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId
      });

      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
      setIsConfirmingPurchase(false);
    }
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'shop':
        return (
          <div className="space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="w-full pl-10 pr-4 py-2 bg-[#1a2234] border border-gray-700 rounded-lg text-white"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="bg-[#1a2234] border border-gray-700 rounded-lg text-white px-3 py-2"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rarity">Rarity</option>
                </select>
                
                <button
                  onClick={() => setActiveCategory(activeCategory === 'all' ? 'nft' : 'all')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1.5 ${
                    activeCategory !== 'all' 
                      ? 'bg-[--color-accent-primary] text-white' 
                      : 'bg-[#1a2234] text-gray-300 border border-gray-700'
                  }`}
                >
                  <Filter size={18} />
                  {activeCategory === 'all' ? 'All Items' : activeCategory.toUpperCase()}
                </button>
              </div>
            </div>
            
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  activeCategory === 'all' 
                    ? 'bg-[--color-accent-primary] text-white' 
                    : 'bg-[#1a2234] text-gray-300 hover:bg-[#242e44]'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setActiveCategory('nft')}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1.5 ${
                  activeCategory === 'nft' 
                    ? 'bg-[--color-accent-primary] text-white' 
                    : 'bg-[#1a2234] text-gray-300 hover:bg-[#242e44]'
                }`}
              >
                <Sparkles size={14} />
                NFTs
              </button>
              <button
                onClick={() => setActiveCategory('gift')}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1.5 ${
                  activeCategory === 'gift' 
                    ? 'bg-[--color-accent-primary] text-white' 
                    : 'bg-[#1a2234] text-gray-300 hover:bg-[#242e44]'
                }`}
              >
                <Gift size={14} />
                Gifts
              </button>
              <button
                onClick={() => setActiveCategory('badge')}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1.5 ${
                  activeCategory === 'badge' 
                    ? 'bg-[--color-accent-primary] text-white' 
                    : 'bg-[#1a2234] text-gray-300 hover:bg-[#242e44]'
                }`}
              >
                <Medal size={14} />
                Badges
              </button>
              <button
                onClick={() => setActiveCategory('theme')}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1.5 ${
                  activeCategory === 'theme' 
                    ? 'bg-[--color-accent-primary] text-white' 
                    : 'bg-[#1a2234] text-gray-300 hover:bg-[#242e44]'
                }`}
              >
                <Palette size={14} />
                Themes
              </button>
            </div>
            
            {/* Items grid */}
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-accent-primary]"></div>
              </div>
            ) : sortedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                {sortedItems.map((item) => (
                  <DigitalItemCard
                    key={item.id}
                    item={item}
                    onSelect={() => setSelectedItem(item)}
                    onAddToCart={() => handleAddToCart(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Store size={48} className="text-gray-500 mx-auto mb-3" />
                <h3 className="text-xl font-medium text-white mb-1">No items found</h3>
                <p className="text-gray-400">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        );
        
      case 'collection':
        return (
          <div className="text-center py-10">
            <ShoppingCart size={48} className="text-gray-500 mx-auto mb-3" />
            <h3 className="text-xl font-medium text-white mb-1">Your Collection</h3>
            <p className="text-gray-400">Items you purchase will appear here</p>
          </div>
        );
        
      case 'rewards':
        return <ContentRewards />;
        
      case 'leaderboard':
        return <Leaderboard />;
        
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#121826] rounded-lg shadow-xl border border-[--color-accent-primary]/10 overflow-hidden max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[--color-accent-primary]/20 to-[--color-accent-secondary]/20 p-4 flex items-center justify-between border-b border-[--color-accent-primary]/10">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Store size={20} className="text-[--color-accent-primary]" />
          Digital Marketplace
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#121826] px-3 py-1.5 rounded-lg border border-[--color-accent-primary]/20">
            <Coins size={16} className="text-[--color-accent-primary]" />
            <span className="font-medium text-white">{balance}</span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-[--color-accent-primary]/10">
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'shop' 
              ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' 
              : 'text-gray-400'
          }`}
        >
          Shop
        </button>
        <button
          onClick={() => setActiveTab('collection')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'collection' 
              ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' 
              : 'text-gray-400'
          }`}
        >
          Collection
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'rewards' 
              ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' 
              : 'text-gray-400'
          }`}
        >
          Earn Tokens
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'leaderboard' 
              ? 'text-[--color-accent-primary] border-b-2 border-[--color-accent-primary]' 
              : 'text-gray-400'
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <Trophy size={16} />
            Rankings
          </div>
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
      
      {/* Item details modal */}
      {selectedItem && (
        <ItemDetails
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={() => {
            handleAddToCart(selectedItem);
            setSelectedItem(null);
          }}
          balance={balance}
        />
      )}

      {/* Purchase confirmation dialog */}
      {isConfirmingPurchase && renderConfirmationDialog()}
      
      {/* Success message toast */}
      <AnimatePresence>
        {showSuccessMessage && renderSuccessMessage()}
      </AnimatePresence>
    </div>
  );
};

// Icon imports
import { CheckCircle, Share2, MapPin } from 'lucide-react';
import { TOKEN_ECONOMY } from '../../lib/tokenStore';

// Sample items for fallback if database connection fails
const SAMPLE_ITEMS: DigitalItem[] = [
  {
    id: 'spring-training-2025',
    name: '⚾ Spring Training 2025 Badge',
    description: 'LIMITED TIME OFFER! Legendary badge celebrating Spring Training 2025. Special promotional price of just $5!',
    image_url: 'https://images.unsplash.com/photo-1508163223045-1880bc36e222?w=400&h=400&fit=crop',
    price: 5,
    item_type: 'badge',
    rarity: 'legendary',
    supply: 100,
    remaining: 100,
    transferable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-1',
    name: 'Elite Influencer Badge',
    description: 'Award this prestigious badge to recognize exceptional content creators',
    image_url: 'https://images.unsplash.com/photo-1614036417651-efe5912149d8?w=400&h=400&fit=crop',
    price: 25,
    item_type: 'badge',
    rarity: 'uncommon',
    supply: 1000,
    remaining: 1000,
    transferable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-2',
    name: 'Diamond Trophy',
    description: 'The ultimate recognition for outstanding achievements',
    image_url: 'https://images.unsplash.com/photo-1590072060133-4448f3954f98?w=400&h=400&fit=crop',
    price: 100,
    item_type: 'badge',
    rarity: 'rare',
    supply: 500,
    remaining: 500,
    transferable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-3',
    name: 'Celebration Box',
    description: 'Send a virtual celebration package to someone special',
    image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop',
    price: 15,
    item_type: 'gift',
    rarity: 'common',
    supply: 10000,
    remaining: 10000,
    transferable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-4',
    name: 'Neon Dreams Theme',
    description: 'Transform your app with vibrant neon colors and glowing accents',
    image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop',
    price: 75,
    item_type: 'theme',
    rarity: 'epic',
    supply: 100,
    remaining: 100,
    transferable: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-5',
    name: 'Phoenix Rising NFT',
    description: 'Limited edition NFT celebrating the spirit of Phoenix',
    image_url: 'https://images.unsplash.com/photo-1604782206219-3b9576575203?w=400&h=400&fit=crop',
    price: 250,
    item_type: 'nft',
    rarity: 'legendary',
    supply: 10,
    remaining: 10,
    transferable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-6',
    name: 'Desert Sunset Theme',
    description: 'Beautiful desert-inspired color scheme with warm gradients',
    image_url: 'https://images.unsplash.com/photo-1604108415419-6d4bd73a1c2c?w=400&h=400&fit=crop',
    price: 50,
    item_type: 'theme',
    rarity: 'rare',
    supply: 200,
    remaining: 200,
    transferable: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-7',
    name: 'VIP Gift Box',
    description: 'Premium virtual gift box with exclusive rewards',
    image_url: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop',
    price: 45,
    item_type: 'gift',
    rarity: 'epic',
    supply: 500,
    remaining: 500,
    transferable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-8',
    name: 'Local Legend Badge',
    description: 'Recognize the most influential local content creators',
    image_url: 'https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=400&h=400&fit=crop',
    price: 35,
    item_type: 'badge',
    rarity: 'rare',
    supply: 750,
    remaining: 750,
    transferable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'item-9',
    name: 'Cyber City NFT',
    description: 'Futuristic digital art celebrating urban nightlife',
    image_url: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&h=400&fit=crop',
    price: 300,
    item_type: 'nft',
    rarity: 'legendary',
    supply: 5,
    remaining: 5,
    transferable: true,
    created_at: new Date().toISOString()
  }
];