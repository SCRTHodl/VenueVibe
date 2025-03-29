import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { tokenService } from '../../lib/tokenService';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/modal';
import LoadingSpinner from '../ui/loading-spinner';
import { EventNFT as EventNFTType, EventBadge as EventBadgeType } from '../../types/eventTypes';
import { SpecialEvent } from '../../types';

interface User {
  id: string;
  email: string;
  name: string;
}

interface EventNFTsProps {
  event: {
    id: string;
    name: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    image_url?: string;
    created_at: string;
    updated_at: string;
  } | null;
}

const EventNFTs: React.FC<EventNFTsProps> = ({ event }) => {
  const [nfts, setNFTs] = useState<EventNFTType[]>([]);
  const [badges, setBadges] = useState<EventBadgeType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [isAwarding, setIsAwarding] = useState<boolean>(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  useEffect(() => {
    if (event) {
      loadEventAssets();
    }
  }, [event?.id]);

  const loadEventAssets = async () => {
    if (!event?.id) return;

    try {
      setIsLoading(true);

      // Load NFTs for this event
      const { data: eventNFTs, error: nftError } = await supabase
        .from('event_nfts')
        .select('*')
        .eq('event_id', event.id);

      if (nftError) throw nftError;

      // Load badges for this event
      const { data: eventBadges, error: badgeError } = await supabase
        .from('event_badges')
        .select('*')
        .eq('event_id', event.id);

      if (badgeError) throw badgeError;

      setNFTs(eventNFTs || []);
      setBadges(eventBadges || []);
    } catch (error) {
      console.error('Error loading event assets:', error);
      toast.error('Failed to load event assets');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsFetchingUsers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const handleMintNFT = async (userId: string) => {
    try {
      setIsMinting(true);
      if (!event) return;
      await tokenService.mintNFT(userId, event.id, { event_id: event.id });
      await loadEventAssets();
      toast.success('NFT minted successfully');
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast.error('Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  const handleAwardBadge = async (userId: string, badgeType: 'attendance' | 'participant' | 'contributor') => {
    try {
      setIsAwarding(true);
      if (!event) return;
      await tokenService.awardBadge(userId, event.id, badgeType, { event_id: event.id });
      await loadEventAssets();
      toast.success('Badge awarded successfully');
    } catch (error) {
      console.error('Error awarding badge:', error);
      toast.error('Failed to award badge');
    } finally {
      setIsAwarding(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(false);
  };

  if (!event) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold">Event NFTs and Badges</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowUserModal(true)}
            disabled={isMinting || isAwarding}
          >
            <Plus className="mr-2 h-4 w-4" />
            Mint NFT
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedUser(null);
              setShowUserModal(true);
            }}
            disabled={isMinting || isAwarding}
          >
            <Plus className="mr-2 h-4 w-4" />
            Award Badge
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-full">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-4">Event NFTs</h3>
                <div className="space-y-4">
                  {nfts.map((nft) => (
                    <div
                      key={nft.id}
                      className="p-4 border rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">Owner: {nft.owner_id}</p>
                        <p className="text-sm text-gray-500">Minted: {new Date(nft.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          NFT
                        </span>
                      </div>
                    </div>
                  ))}
                  {nfts.length === 0 && (
                    <p className="text-center text-gray-500">No NFTs minted yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-4">Event Badges</h3>
                <div className="space-y-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="p-4 border rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">Owner: {badge.user_id}</p>
                        <p className="text-sm text-gray-500">Type: {badge.badge_type}</p>
                        <p className="text-sm text-gray-500">Awarded: {new Date(badge.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Badge
                        </span>
                      </div>
                    </div>
                  ))}
                  {badges.length === 0 && (
                    <p className="text-center text-gray-500">No badges awarded yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Modal
            isOpen={showUserModal}
            onClose={() => {
              setShowUserModal(false);
              setSelectedUser(null);
            }}
            title={selectedUser ? 'Select Action' : 'Select User'}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Select User</h3>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      const filteredUsers = users.filter(user =>
                        user.email.toLowerCase().includes(searchTerm) ||
                        user.name.toLowerCase().includes(searchTerm)
                      );
                      setUsers(filteredUsers);
                    }}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {selectedUser?.id === user.id ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowUserModal(false)}
                  >
                    Cancel
                  </Button>
                  {selectedUser && (
                    <Button
                      onClick={() => {
                        if (selectedUser) {
                          handleMintNFT(selectedUser.id);
                        }
                      }}
                      disabled={isMinting}
                    >
                      Mint NFT
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default EventNFTs;
