import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, X, Shield, Clock, Star, Ban, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { adminService } from '../../lib/adminService';

interface User {
  id: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  lastActive: string;
  createdAt: string;
  totalPosts: number;
  totalStories: number;
  reputationScore: number;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<'suspend' | 'ban' | 'activate' | null>(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            stories(count),
            posts(count)
          `);

        if (error) throw error;

        const transformedUsers: User[] = data.map(user => ({
          id: user.id,
          email: user.email,
          role: user.role || 'user',
          status: user.status || 'active',
          lastActive: user.last_active,
          createdAt: user.created_at,
          totalPosts: user.posts_count || 0,
          totalStories: user.stories_count || 0,
          reputationScore: user.reputation_score || 0
        }));

        setUsers(transformedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter and search users
  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.status === filter;
    const matchesSearch = !searchQuery || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle user action
  const handleUserAction = async (action: 'suspend' | 'ban' | 'activate') => {
    if (!selectedUser) return;

    try {
      // Use the adminService instead of direct RPC call
      const status = action === 'activate' ? 'active' : action;
      const updatedUser = await adminService.updateUserStatus(selectedUser.id, status);
      
      if (!updatedUser) throw new Error('Failed to update user status');

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, status: action === 'activate' ? 'active' : action }
          : user
      ));

      setSelectedUser(null);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121826]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-[--color-accent-primary]" />
            User Management
          </h2>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
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
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-accent-primary]"></div>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                className="bg-[#1a2234] rounded-lg p-4 border border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-500/20 text-green-300' 
                          : user.status === 'suspended'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {user.status.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-white mb-2">{user.email}</div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Posts</div>
                        <div className="text-white">{user.totalPosts}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Stories</div>
                        <div className="text-white">{user.totalStories}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Reputation</div>
                        <div className="text-white">{user.reputationScore}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedUser(user)}
                    className="p-2 rounded-full hover:bg-gray-700"
                  >
                    <Shield size={20} className="text-[--color-accent-primary]" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users size={48} className="text-gray-500 mx-auto mb-3" />
            <h3 className="text-xl font-medium text-white mb-1">No users found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* User action dialog */}
      <AnimatePresence>
        {selectedUser && (
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
              <h3 className="text-xl font-bold text-white mb-4">Manage User</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Email</div>
                  <div className="text-white">{selectedUser.email}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <div className={`text-sm font-medium ${
                      selectedUser.status === 'active' 
                        ? 'text-green-400' 
                        : selectedUser.status === 'suspended'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}>
                      {selectedUser.status.toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 mb-1">Member Since</div>
                    <div className="text-white text-sm">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="bg-[#121826] rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Activity Overview</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Posts</div>
                      <div className="text-white font-medium">{selectedUser.totalPosts}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Stories</div>
                      <div className="text-white font-medium">{selectedUser.totalStories}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Reputation</div>
                      <div className="text-white font-medium">{selectedUser.reputationScore}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>

                {selectedUser.status === 'active' ? (
                  <>
                    <button
                      onClick={() => {
                        setConfirmationAction('suspend');
                        setShowConfirmation(true);
                      }}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Clock size={18} />
                      Suspend
                    </button>
                    <button
                      onClick={() => {
                        setConfirmationAction('ban');
                        setShowConfirmation(true);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Ban size={18} />
                      Ban
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setConfirmationAction('activate');
                      setShowConfirmation(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Activate
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {showConfirmation && confirmationAction && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md bg-[#1a2234] rounded-lg p-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">Confirm Action</h3>

              <p className="text-gray-300 mb-6">
                {confirmationAction === 'suspend' && 'Are you sure you want to suspend this user? They will be temporarily blocked from using the platform.'}
                {confirmationAction === 'ban' && 'Are you sure you want to ban this user? This action is permanent and cannot be undone.'}
                {confirmationAction === 'activate' && 'Are you sure you want to reactivate this user? They will regain access to the platform.'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUserAction(confirmationAction)}
                  className={`flex-1 py-2 rounded-lg text-white ${
                    confirmationAction === 'suspend' 
                      ? 'bg-yellow-600 hover:bg-yellow-500'
                      : confirmationAction === 'ban'
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-green-600 hover:bg-green-500'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};