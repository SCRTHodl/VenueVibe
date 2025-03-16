import React from 'react';
import { Tag } from 'lucide-react';
import type { AppStats } from '../types';

interface AppStatsProps {
  stats: AppStats;
}

export const AppStats: React.FC<AppStatsProps> = ({ stats }) => {
  // Handle case where stats is undefined or null
  if (!stats) {
    return null;
  }

  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3">
      <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg text-sm text-gray-600">
        <span className="font-medium">{stats?.subscriberCount?.toLocaleString() || '0'}</span> subscribers
      </div>
      <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg text-sm text-gray-600 flex items-center gap-2">
        <Tag size={14} className="text-blue-500" />
        v{stats?.version || '1.0.0'}
      </div>
    </div>
  );
};