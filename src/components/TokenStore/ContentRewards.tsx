import React, { useState, useEffect } from 'react';
import { Trophy, Star, MessageSquare, ThumbsUp, Share, Sparkles, Award, Zap, ArrowRight, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTokenStore, TOKEN_ECONOMY } from '../../lib/tokenStore';

export const ContentRewards: React.FC = () => {
  const [earnedToday, setEarnedToday] = useState<number>(0);
  const [nextReward, setNextReward] = useState<{type: string, amount: number, cooldown: string} | null>(null);
  
  const { earnTokens } = useTokenStore();
  
  // Simulated rewards history
  const rewardHistory = [
    { id: 'r1', type: 'post', amount: 5, time: '2 hours ago' },
    { id: 'r2', type: 'like', amount: 1, time: '3 hours ago' },
    { id: 'r3', type: 'share', amount: 5, time: '1 day ago' },
    { id: 'r4', type: 'comment', amount: 2, time: '1 day ago' },
    { id: 'r5', type: 'daily_login', amount: 10, time: '1 day ago' },
  ];
  
  // Simulate cooldown timers for rewards
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate a random next reward
      const rewardTypes = ['post', 'comment', 'daily_login', 'like', 'share', 'badge'];
      const randomType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
      const reward = TOKEN_ECONOMY.REWARDS[randomType as keyof typeof TOKEN_ECONOMY.REWARDS] || 0;
      
      // Random cooldown between 1-30 minutes
      const minutes = Math.floor(Math.random() * 30) + 1;
      setNextReward({
        type: randomType,
        amount: reward,
        cooldown: `${minutes} minute${minutes > 1 ? 's' : ''}`
      });
      
      // Random earned today amount
      setEarnedToday(Math.floor(Math.random() * 50) + 10);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Simulate claiming a daily reward
  const handleClaimDaily = async () => {
    const success = await earnTokens(10, 'Daily login reward');
    if (success) {
      alert('You claimed 10 tokens for your daily login!');
      setEarnedToday(prev => prev + 10);
    }
  };
  
  // Get icon for reward type
  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'post': return <Zap size={16} className="text-blue-400" />;
      case 'like': return <ThumbsUp size={16} className="text-red-400" />;
      case 'share': return <Share size={16} className="text-green-400" />;
      case 'comment': return <MessageSquare size={16} className="text-purple-400" />;
      case 'badge': return <Award size={16} className="text-yellow-400" />;
      case 'daily_login': return <Calendar size={16} className="text-orange-400" />;
      default: return <Star size={16} className="text-blue-400" />;
    }
  };
  
  // Get reward description
  const getRewardDescription = (type: string) => {
    switch (type) {
      case 'post': return 'Creating a new post';
      case 'like': return 'Receiving a like on content';
      case 'share': return 'Someone shared your content';
      case 'comment': return 'Adding a comment';
      case 'badge': return 'Receiving a badge';
      case 'daily_login': return 'Daily login reward';
      default: return 'Engaging with the platform';
    }
  };
  
  return (
    <div className="space-y-5">
      {/* Stats summary */}
      <div className="bg-[#1a2234] rounded-lg p-4 border border-[--color-accent-primary]/20">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-400 text-sm mb-1">Earned Today</div>
            <div className="flex items-center gap-2">
              <Star size={20} className="text-[--color-accent-primary]" />
              <span className="text-2xl font-bold text-white">{earnedToday}</span>
            </div>
          </div>
          
          <div>
            <div className="text-gray-400 text-sm mb-1">Next Reward</div>
            {nextReward ? (
              <div className="flex items-center gap-2">
                {getRewardIcon(nextReward.type)}
                <div>
                  <span className="text-white font-medium">{nextReward.amount}</span>
                  <span className="text-xs text-gray-400 ml-1">in {nextReward.cooldown}</span>
                </div>
              </div>
            ) : (
              <div className="text-white">Available now!</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Daily login */}
      <div className="bg-[#1a2234] rounded-lg border border-[--color-accent-primary]/20 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-medium">Daily Rewards</h3>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[--color-accent-primary]/20">
                <Calendar size={20} className="text-[--color-accent-primary]" />
              </div>
              
              <div>
                <div className="text-white font-medium">Daily Login</div>
                <div className="text-sm text-gray-400">Claim once every 24 hours</div>
              </div>
            </div>
            
            <button 
              onClick={handleClaimDaily}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] text-white text-sm font-medium flex items-center gap-2"
            >
              <Star size={16} />
              Claim 10
            </button>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs text-gray-400">Daily streak: 3 days</div>
              <div className="text-xs text-gray-400">Next: 4 days (15 tokens)</div>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary]"
                style={{ width: '60%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ways to earn */}
      <div className="bg-[#1a2234] rounded-lg border border-[--color-accent-primary]/20">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-medium">Ways to Earn Influence</h3>
        </div>
        
        <div className="divide-y divide-gray-700">
          {Object.entries(TOKEN_ECONOMY.REWARDS).map(([key, amount]) => (
            <div key={key} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#121826]">
                  {getRewardIcon(key)}
                </div>
                
                <div>
                  <div className="text-white font-medium">{getRewardDescription(key)}</div>
                  <div className="text-sm text-gray-400">Up to {TOKEN_ECONOMY.REWARDS[key as keyof typeof TOKEN_ECONOMY.REWARDS]} tokens per action</div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-[--color-accent-primary] font-bold">
                +{amount}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent earnings history */}
      <div className="bg-[#1a2234] rounded-lg border border-[--color-accent-primary]/20">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-white font-medium">Recent Earnings</h3>
        </div>
        
        <div className="divide-y divide-gray-700">
          {rewardHistory.map(reward => (
            <div key={reward.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#121826]">
                  {getRewardIcon(reward.type)}
                </div>
                
                <div>
                  <div className="text-white font-medium">{getRewardDescription(reward.type)}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    <span>{reward.time}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-[--color-accent-primary] font-bold">
                +{reward.amount}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <button className="w-full text-center text-[--color-accent-primary] text-sm flex items-center justify-center gap-1">
            View all history <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};