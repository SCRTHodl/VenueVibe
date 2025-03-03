import React from 'react';
import { TrendingTopicsSection } from './TrendingTopicsSection';
import { LocalEventsSection } from './LocalEventsSection';
import { AIRecommendationsSection } from './AIRecommendationsSection';
import { TRENDING_TOPICS, LOCAL_EVENTS, AI_RECOMMENDATIONS } from '../../constants';

export const LocalContentFeed: React.FC = () => {
  return (
    <div className="space-y-6 p-3">
      <TrendingTopicsSection topics={TRENDING_TOPICS} />
      <LocalEventsSection events={LOCAL_EVENTS} />
      <AIRecommendationsSection recommendations={AI_RECOMMENDATIONS} />
    </div>
  );
};