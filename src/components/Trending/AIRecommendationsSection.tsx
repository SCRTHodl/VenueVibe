import React from 'react';
import { Sparkles, ChevronRight, MapPin, Star } from 'lucide-react';
import { AIRecommendation } from '../../types';
import { motion } from 'framer-motion';

interface AIRecommendationsSectionProps {
  recommendations: AIRecommendation[];
}

export const AIRecommendationsSection: React.FC<AIRecommendationsSectionProps> = ({ recommendations }) => {
  return (
    <div className="relative mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-white text-lg flex items-center gap-2">
          <Sparkles size={18} className="text-[--color-accent-primary]" />
          For You
        </h2>
        <button className="text-sm text-[--color-accent-primary] flex items-center">
          More <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="rounded-xl bg-[#181f32] border border-[--color-accent-primary]/10 p-4 shadow-lg overflow-hidden">
        {recommendations.map((recommendation, index) => (
          <RecommendationCard key={recommendation.id} recommendation={recommendation} index={index} />
        ))}
      </div>
    </div>
  );
};

interface RecommendationCardProps {
  recommendation: AIRecommendation;
  index: number;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, index }) => {
  const [isExpanded, setIsExpanded] = React.useState(index === 0);  // First one expanded by default

  return (
    <div className={`${index > 0 ? 'mt-3 pt-3 border-t border-[--color-accent-primary]/10' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            {recommendation.title}
            <span className="text-xs px-2 py-0.5 rounded-full bg-[--color-accent-primary]/20 text-[--color-accent-primary]">
              {recommendation.matchScore}% match
            </span>
          </h3>
          <p className="text-sm text-gray-300 mb-2">{recommendation.description}</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 rounded-full ${isExpanded ? 'bg-[--color-accent-primary]/20 text-[--color-accent-primary]' : 'bg-gray-800/50 text-gray-400'}`}
        >
          <ChevronRight size={18} className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>
      
      {isExpanded && (
        <motion.div 
          className="mt-3 space-y-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          {recommendation.items.map((item) => (
            <div key={item.name} className="flex gap-3 rounded-lg overflow-hidden bg-[#121826] p-2 border border-[--color-accent-primary]/5">
              <img src={item.photo} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-white">{item.name}</h4>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[--color-accent-primary]/10 text-[--color-accent-primary]">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 line-clamp-2">{item.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin size={12} className="text-[--color-accent-primary]" />
                    <span>View on map</span>
                  </div>
                  <button className="px-2 py-1 rounded text-xs bg-[--color-accent-primary]/20 text-[--color-accent-primary]">
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <Sparkles size={12} className="text-[--color-accent-primary]" />
              <span>Based on your interests: {recommendation.userInterests.join(', ')}</span>
            </div>
            <button className="text-[--color-accent-primary] text-xs flex items-center gap-1">
              Save to favorites <Star size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};