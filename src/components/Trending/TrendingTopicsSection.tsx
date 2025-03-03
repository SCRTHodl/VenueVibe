import React from 'react';
import { TrendingUp, Flame, ArrowRight, ChevronRight, Clock } from 'lucide-react';
import { TrendingTopic } from '../../types';
import { motion } from 'framer-motion';

interface TrendingTopicsSectionProps {
  topics: TrendingTopic[];
}

export const TrendingTopicsSection: React.FC<TrendingTopicsSectionProps> = ({ topics }) => {
  return (
    <div className="relative mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-white text-lg flex items-center gap-2">
          <TrendingUp size={18} className="text-[--color-accent-primary]" />
          Trending Near You
        </h2>
        <button className="text-sm text-[--color-accent-primary] flex items-center">
          View All <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex gap-3">
          {topics.map((topic) => (
            <TrendingTopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface TrendingTopicCardProps {
  topic: TrendingTopic;
}

const TrendingTopicCard: React.FC<TrendingTopicCardProps> = ({ topic }) => {
  return (
    <motion.div 
      className="relative min-w-[240px] max-w-[240px] rounded-xl overflow-hidden shadow-lg border border-[--color-accent-primary]/10 bg-[#121826]/90"
      whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="h-32 relative">
        <img 
          src={topic.image} 
          alt={topic.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white border border-[--color-accent-primary]/30">
          <Flame size={12} className="text-red-500" />
          {topic.mentions.toLocaleString()} mentions
        </div>
        
        {topic.trend === 'up' && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-green-500/20 text-green-400 backdrop-blur-sm">
            <TrendingUp size={12} />
            {topic.percentChange}%
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-white mb-1 line-clamp-1">{topic.title}</h3>
        <p className="text-xs text-gray-300 mb-2 line-clamp-2">{topic.description}</p>
        
        <div className="flex flex-wrap gap-1">
          {topic.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[--color-accent-primary]/10 text-[--color-accent-primary]">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};