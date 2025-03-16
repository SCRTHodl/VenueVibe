import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { ModerationResult } from '../../../types';

interface ContentModerationManagerProps {
  isChecking: boolean;
  moderationResult: ModerationResult | null;
  onCheckContent: () => Promise<void>;
}

export const ContentModerationManager: React.FC<ContentModerationManagerProps> = ({
  isChecking,
  moderationResult,
  onCheckContent
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-medium">Content Moderation Check</span>
        <button
          type="button"
          onClick={onCheckContent}
          disabled={isChecking}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm flex items-center gap-1"
        >
          {isChecking ? (
            <>
              <Loader size={14} className="animate-spin" /> Checking...
            </>
          ) : (
            'Check Content'
          )}
        </button>
      </div>

      {moderationResult && (
        <div className={`p-3 rounded-md ${
          moderationResult.status === 'approved' ? 'bg-green-900/30' : 
          moderationResult.status === 'pending' ? 'bg-yellow-900/30' : 'bg-red-900/30'
        }`}>
          <div className="flex items-start gap-2">
            {moderationResult.status === 'approved' ? (
              <CheckCircle className="text-green-400 mt-0.5" size={18} />
            ) : (
              <AlertTriangle className="text-yellow-400 mt-0.5" size={18} />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">
                  {moderationResult.status === 'approved' 
                    ? 'Content Approved' 
                    : moderationResult.status === 'pending'
                    ? 'Content Needs Review'
                    : 'Content May Violate Guidelines'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-gray-400 underline"
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              {showDetails && (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-2 text-sm gap-x-4 gap-y-1">
                    <div className="text-gray-400">Overall Score:</div>
                    <div className="text-white">{moderationResult.score.toFixed(2)}</div>
                    
                    <div className="text-gray-400">Spam:</div>
                    <div className="text-white">{moderationResult.spam.toFixed(2)}</div>
                    
                    <div className="text-gray-400">Offensive:</div>
                    <div className="text-white">{moderationResult.offensive.toFixed(2)}</div>
                    
                    <div className="text-gray-400">Adult:</div>
                    <div className="text-white">{moderationResult.adult.toFixed(2)}</div>
                    
                    <div className="text-gray-400">Violence:</div>
                    <div className="text-white">{moderationResult.violence.toFixed(2)}</div>
                  </div>
                  
                  {moderationResult.status !== 'approved' && (
                    <div className="pt-2 text-sm text-yellow-300">
                      <p>Your content will be reviewed before being visible to all users.
                      Please ensure it complies with community guidelines.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentModerationManager;
