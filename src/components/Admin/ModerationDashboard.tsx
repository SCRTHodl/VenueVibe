import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, Clock, Filter, Search, X, ChevronRight, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface ModerationItem {
  id: string;
  contentType: 'story' | 'post' | 'comment';
  contentId: string;
  content: string;
  mediaUrl?: string;
  userId: string;
  userName: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  score: number;
  priority: number;
}

export const ModerationDashboard: React.FC = () => {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    avgResponseTime: '0'
  });

  // Fetch moderation items
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('content_moderation')
          .select(`
            *,
            stories(user_id, caption),
            posts(user_id, content),
            comments(user_id, content)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data
        const transformedItems: ModerationItem[] = data.map(item => ({
          id: item.id,
          contentType: item.content_type,
          contentId: item.content_id,
          content: item.content_text,
          mediaUrl: item.content_media_url,
          userId: item.user_id,
          userName: 'User', // Would fetch from users table in production
          createdAt: item.created_at,
          status: item.moderation_status,
          score: item.moderation_score,
          priority: item.priority || 0
        }));

        setItems(transformedItems);
      } catch (error) {
        console.error('Error fetching moderation items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Fetch moderation stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_api.moderation_stats')
          .select('*')
          .single();

        if (error) throw error;
        if (data) {
          setStats({
            pending: data.pending_count || 0,
            approved: data.approved_count || 0,
            rejected: data.rejected_count || 0,
            avgResponseTime: data.avg_response_time || '0'
          });
        }
      } catch (error) {
        console.error('Error fetching moderation stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Filter and search items
  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = !searchQuery || 
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle moderation action
  const handleModeration = async (itemId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase.rpc('admin_panel.record_moderation_action', {
        p_content_type: selectedItem?.contentType,
        p_content_id: selectedItem?.contentId,
        p_action: action,
        p_reason: action === 'reject' ? 'Content violates community guidelines' : null
      });

      if (error) throw error;

      // Update local state
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
          : item
      ));

      setSelectedItem(null);
    } catch (error) {
      console.error('Error moderating content:', error);
      alert('Failed to moderate content. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121826]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-[--color-accent-primary]" />
            Content Moderation
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-[#1a2234] rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Pending Review</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock size={20} className="text-yellow-400" />
              {stats.pending}
            </div>
          </div>

          <div className="bg-[#1a2234] rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Approved</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle size={20} className="text-green-400" />
              {stats.approved}
            </div>
          </div>

          <div className="bg-[#1a2234] rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Rejected</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertCircle size={20} className="text-red-400" />
              {stats.rejected}
            </div>
          </div>

          <div className="bg-[#1a2234] rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Avg Response Time</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-400" />
              {stats.avgResponseTime}m
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content..."
              className="w-full pl-10 pr-4 py-2 bg-[#1a2234] border border-gray-700 rounded-lg text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-[#1a2234] border border-gray-700 rounded-lg text-white px-3 py-2"
          >
            <option value="all">All Content</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-accent-primary]"></div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                className="bg-[#1a2234] rounded-lg p-4 border border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'pending' 
                          ? 'bg-yellow-500/20 text-yellow-300' 
                          : item.status === 'approved'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-white mb-2">{item.content}</p>

                    {item.mediaUrl && (
                      <div className="mb-2">
                        <img 
                          src={item.mediaUrl} 
                          alt="Content" 
                          className="max-h-40 rounded-lg"
                        />
                      </div>
                    )}

                    <div className="text-sm text-gray-400">
                      Posted by {item.userName}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedItem(item)}
                    className="p-2 rounded-full hover:bg-gray-700"
                  >
                    <ChevronRight size={20} className="text-gray-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield size={48} className="text-gray-500 mx-auto mb-3" />
            <h3 className="text-xl font-medium text-white mb-1">No items to review</h3>
            <p className="text-gray-400">All content has been moderated</p>
          </div>
        )}
      </div>

      {/* Moderation dialog */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg bg-[#1a2234] rounded-lg p-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Review Content</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Content</div>
                  <div className="bg-[#121826] rounded-lg p-3 text-white">
                    {selectedItem.content}
                  </div>
                </div>

                {selectedItem.mediaUrl && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Media</div>
                    <img 
                      src={selectedItem.mediaUrl} 
                      alt="Content" 
                      className="max-h-60 rounded-lg"
                    />
                  </div>
                )}

                <div className="bg-[#121826] rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">AI Score</span>
                    <span className={`font-medium ${
                      selectedItem.score > 0.8 ? 'text-green-400' :
                      selectedItem.score > 0.5 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {(selectedItem.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleModeration(selectedItem.id, 'reject')}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleModeration(selectedItem.id, 'approve')}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg"
                >
                  Approve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};