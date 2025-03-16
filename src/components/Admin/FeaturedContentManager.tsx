import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Sparkles, Plus, Trash2, Search, Check, X, MessageSquare, Loader2 } from 'lucide-react';
import { UserStory } from '../../types';
import { useTokenStore } from '../../lib/tokenStore';
import { createTokenTransaction } from '../../lib/supabase/tokenEconomy';

interface FeaturedContentManagerProps {
  className?: string;
}

type ContentType = 'stories' | 'events' | 'locations';
type AIInsight = {
  score: number;
  reason: string;
  keywords: string[];
  audiences: string[];
  engagement_prediction: {
    level: 'low' | 'medium' | 'high';
    score: number;
  };
};

export const FeaturedContentManager: React.FC<FeaturedContentManagerProps> = ({ 
  className = ''
}) => {
  const [contentType, setContentType] = useState<ContentType>('stories');
  const [content, setContent] = useState<any[]>([]);
  const [featuredContent, setFeaturedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<Record<string, AIInsight>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const { earnTokens } = useTokenStore();

  useEffect(() => {
    loadContent();
    loadFeaturedContent();
  }, [contentType]);

  const loadContent = async () => {
    setLoading(true);
    try {
      let { data, error } = await supabase
        .from(contentType)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error(`Error loading ${contentType}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedContent = async () => {
    try {
      let { data, error } = await supabase
        .from('featured_content')
        .select('*')
        .eq('content_type', contentType)
        .order('priority', { ascending: true });

      if (error) throw error;
      setFeaturedContent(data || []);
    } catch (error) {
      console.error(`Error loading featured ${contentType}:`, error);
    }
  };

  const addToFeatured = async (itemId: string, priority: number = 10) => {
    try {
      const { error } = await supabase
        .from('featured_content')
        .insert([{
          content_id: itemId,
          content_type: contentType,
          priority,
          added_at: new Date().toISOString(),
          added_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;
      await loadFeaturedContent();
    } catch (error) {
      console.error('Error featuring content:', error);
    }
  };

  const removeFromFeatured = async (id: string) => {
    try {
      const { error } = await supabase
        .from('featured_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadFeaturedContent();
    } catch (error) {
      console.error('Error removing featured content:', error);
    }
  };

  const getAiInsights = async (contentId: string) => {
    setAiLoading(true);
    try {
      // Check if insights are already cached
      if (aiInsights[contentId]) {
        return;
      }

      // Get content details
      const { data: contentData } = await supabase
        .from(contentType)
        .select('*')
        .eq('id', contentId)
        .single();
        
      if (!contentData) return;

      // This would use your AI service or OpenAI API
      // For now, we're simulating AI insights
      const simulatedResponse: AIInsight = {
        score: Math.round(Math.random() * 100) / 10,
        reason: "This content has high visual appeal and aligns with trending topics.",
        keywords: ["premium", "engaging", "trending"],
        audiences: ["young adults", "content creators"],
        engagement_prediction: {
          level: Math.random() > 0.5 ? 'high' : 'medium',
          score: Math.round(Math.random() * 100) / 10
        }
      };

      // In a real implementation, you would call an API like:
      /*
      const response = await fetch('/api/ai/content-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentData, contentType })
      });
      const data = await response.json();
      */

      // Update the insights state
      setAiInsights(prev => ({
        ...prev,
        [contentId]: simulatedResponse
      }));

      // Record the AI usage for token economy
      await createTokenTransaction({
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        amount: -1, // Cost 1 token to analyze content
        transaction_type: 'ai_content_analysis',
        metadata: { contentId, contentType }
      });

    } catch (error) {
      console.error('Error getting AI insights:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const runAiQueryOnContent = async () => {
    if (!aiPrompt.trim()) return;
    
    setAiLoading(true);
    try {
      // This would connect to your AI service
      // For demo purposes, generating a simulated response
      const simulatedAiResponse = `Based on your query "${aiPrompt}", I would recommend featuring the following content:
      
1. The story about urban exploration has high engagement potential with your target demographic.
2. Consider promoting content related to local events as user engagement with events is trending upward.
3. Your premium content on sustainable living aligns with trending topics on social platforms.

Would you like me to automatically update your featured content based on these recommendations?`;

      setAiResponse(simulatedAiResponse);
      
      // In a real implementation, call your AI service:
      /*
      const response = await fetch('/api/ai/content-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, contentType })
      });
      const data = await response.json();
      setAiResponse(data.response);
      */
      
      // Reward admin for using AI features
      await earnTokens(2, 'ai_feature_usage');
      
    } catch (error) {
      console.error('Error with AI query:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Filter content based on search query
  const filteredContent = content.filter(item => {
    const searchFields = contentType === 'stories' 
      ? [item.title, item.description]
      : contentType === 'events'
        ? [item.name, item.description]
        : [item.name, item.description];
        
    return searchFields.some(field => 
      field && field.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const isFeatured = (id: string) => {
    return featuredContent.some(item => item.content_id === id);
  };

  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Sparkles className="mr-2 text-purple-600" size={24} />
          Featured Content Manager
        </h2>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 rounded ${contentType === 'stories' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setContentType('stories')}
          >
            Stories
          </button>
          <button 
            className={`px-3 py-1 rounded ${contentType === 'events' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setContentType('events')}
          >
            Events
          </button>
          <button 
            className={`px-3 py-1 rounded ${contentType === 'locations' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setContentType('locations')}
          >
            Locations
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Assistant Panel */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <MessageSquare className="mr-2 text-purple-600" size={18} />
            AI Content Assistant
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Ask AI about content strategy</label>
            <div className="flex">
              <input
                type="text"
                className="flex-1 p-2 border rounded-l"
                placeholder="E.g., What content should we feature this week?"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <button 
                className="bg-purple-600 text-white px-3 py-2 rounded-r flex items-center"
                onClick={runAiQueryOnContent}
                disabled={aiLoading}
              >
                {aiLoading ? <Loader2 className="animate-spin" size={18} /> : 'Ask'}
              </button>
            </div>
          </div>
          
          {aiResponse && (
            <div className="bg-white p-3 rounded border border-purple-200 mb-4">
              <p className="text-sm whitespace-pre-line">{aiResponse}</p>
            </div>
          )}
          
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Quick AI Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button 
                className="bg-purple-100 text-purple-700 px-2 py-1 text-xs rounded hover:bg-purple-200"
                onClick={() => setAiPrompt("What content is trending right now?")}
              >
                Identify trends
              </button>
              <button 
                className="bg-purple-100 text-purple-700 px-2 py-1 text-xs rounded hover:bg-purple-200"
                onClick={() => setAiPrompt("Suggest 3 stories to feature for increased engagement")}
              >
                Engagement suggestions
              </button>
              <button 
                className="bg-purple-100 text-purple-700 px-2 py-1 text-xs rounded hover:bg-purple-200"
                onClick={() => setAiPrompt("Analyze our current featured content performance")}
              >
                Performance analysis
              </button>
            </div>
          </div>
        </div>
        
        {/* Featured Content List */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Currently Featured</h3>
          
          {featuredContent.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No featured {contentType} yet</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {featuredContent.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center">
                    <span className="font-medium mr-2 flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-100 rounded-full text-xs">
                      {item.priority}
                    </span>
                    <span className="truncate text-sm">{
                      // This would need to display the actual content title/name
                      // For now using a placeholder
                      item.content_id.substring(0, 15)
                    }</span>
                  </div>
                  <button 
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeFromFeatured(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Available Content */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Available {contentType}</h3>
          <div className="relative">
            <Search className="absolute left-2 top-2 text-gray-400" size={16} />
            <input
              type="text"
              className="pl-8 pr-2 py-1 border rounded"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-purple-600" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2">
            {filteredContent.map(item => (
              <div 
                key={item.id} 
                className={`p-3 rounded-lg border transition-all ${
                  isFeatured(item.id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium truncate">
                    {item.title || item.name || 'Untitled'}
                  </h4>
                  <div className="flex">
                    {isFeatured(item.id) ? (
                      <span className="text-purple-600 flex items-center text-xs">
                        <Check size={14} className="mr-1" /> Featured
                      </span>
                    ) : (
                      <button
                        className="text-gray-600 hover:text-purple-600"
                        onClick={() => addToFeatured(item.id)}
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                  {item.description || 'No description available'}
                </p>
                
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  
                  <button
                    className="text-xs text-purple-600 flex items-center"
                    onClick={() => getAiInsights(item.id)}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 size={12} className="animate-spin mr-1" />
                    ) : (
                      <Sparkles size={12} className="mr-1" />
                    )}
                    AI Insights
                  </button>
                </div>
                
                {aiInsights[item.id] && (
                  <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium">Engagement Score:</span>
                      <span className={`${
                        aiInsights[item.id].score > 7 ? 'text-green-600' : 
                        aiInsights[item.id].score > 4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {aiInsights[item.id].score}/10
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="font-medium">Key Audiences:</span>
                      <span className="ml-1">{aiInsights[item.id].audiences.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
