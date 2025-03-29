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
  event: SpecialEvent | null;
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
      setNFTs(eventNFTs || []);

      // Load badges for this event
      const { data: eventBadges, error: badgeError } = await supabase
        .from('event_badges')
        .select('*')
        .eq('event_id', event.id);

      if (badgeError) throw badgeError;
      setBadges(eventBadges || []);
    } catch (error) {
      console.error('Error loading event assets:', error);
      toast.error('Failed to load event assets');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsFetchingUsers(true);
      const { data: usersData, error } = await supabase
        .from('users')
        .select('id, email, name');

      if (error) throw error;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const mintNFT = async () => {
    if (!event?.id || !selectedUser) return;

    try {
      setIsMinting(true);
      
      const { error } = await supabase
        .from('event_nfts')
        .insert([{
          event_id: event.id,
          owner_id: selectedUser.id,
          metadata: {
            image: event.imageUrl || 'default-nft-image',
            name: `${event.name} NFT`,
            description: `Exclusive NFT for ${event.name}`,
            minted_at: new Date().toISOString(),
            owner: selectedUser.name
          }
        }]);

      if (error) throw error;

      toast.success('NFT minted successfully');
      loadEventAssets();
      setShowUserModal(false);
    } catch (error) {
      console.error('Error minting NFT:', error);
      toast.error('Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  const awardBadge = async (badgeType: EventBadgeType['badge_type']) => {
    if (!event?.id || !selectedUser) return;

    try {
      setIsAwarding(true);
      
      const { error } = await supabase
        .from('event_badges')
        .insert([{
          event_id: event.id,
          user_id: selectedUser.id,
          badge_type: badgeType,
          metadata: {
            name: `${badgeType.charAt(0).toUpperCase() + badgeType.slice(1)} Badge`,
            awarded_at: new Date().toISOString(),
            awardee: selectedUser.name
          }
        }]);

      if (error) throw error;

      toast.success('Badge awarded successfully');
      loadEventAssets();
      setShowUserModal(false);
    } catch (error) {
      console.error('Error awarding badge:', error);
      toast.error('Failed to award badge');
    } finally {
      setIsAwarding(false);
    }
  };

  const renderNFTs = () => {
    if (nfts.length === 0) return <p>No NFTs found for this event</p>;

    return nfts.map((nft) => (
      <div key={nft.id} className="p-4 border-b last:border-b-0">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <img
              src={nft.metadata?.image || '/default-nft.png'}
              alt={nft.metadata?.name || 'NFT'}
              className="w-24 h-24 object-cover rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{nft.metadata?.name || 'Unknown NFT'}</h3>
            <p className="text-gray-600">{nft.metadata?.description || 'No description'}</p>
            <p className="mt-2 text-sm text-gray-500">
              Owner: {nft.owner_id}
            </p>
            <p className="text-sm text-gray-500">
              Minted: {new Date(nft.metadata?.minted_at || '').toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    ));
  };

  const renderBadges = () => {
    if (badges.length === 0) return <p>No badges found for this event</p>;

    return badges.map((badge) => (
      <div key={badge.id} className="p-4 border-b last:border-b-0">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {badge.badge_type.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">
              {badge.metadata?.name || badge.badge_type}
            </h3>
            <p className="text-sm text-gray-500">
              Awarded to: {badge.user_id}
            </p>
            <p className="text-sm text-gray-500">
              Awarded at: {new Date(badge.metadata?.awarded_at || '').toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Event NFTs</h3>
        <div className="border rounded-lg p-4">
          {renderNFTs()}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Event Badges</h3>
        <div className="border rounded-lg p-4">
          {renderBadges()}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setShowUserModal(true)}
          disabled={isMinting || isAwarding}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {isMinting ? (
            <>
              <LoadingSpinner className="mr-2" />
              Minting NFT...
            </>
          ) : (
            'Mint NFT'
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            if (selectedUser) {
              awardBadge('participant');
            }
          }}
          disabled={!selectedUser || isAwarding}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {isAwarding ? (
            <>
              <LoadingSpinner className="mr-2" />
              Awarding Badge...
            </>
          ) : (
            'Award Badge'
          )}
        </Button>
      </div>

      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Select User"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Select User</h3>
            <Button
              variant="outline"
              onClick={() => {
                loadUsers();
              }}
              className="flex items-center gap-2"
            >
              <LoadingSpinner className="w-4 h-4" />
              {isFetchingUsers ? 'Loading...' : 'Refresh Users'}
            </Button>
          </div>

          <div className="space-y-2">
            {users.map((user) => (
              <Button
                key={user.id}
                variant={selectedUser?.id === user.id ? "default" : "outline"}
                onClick={() => setSelectedUser(user)}
                className="w-full justify-start"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-sm text-gray-500">{user.email}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventNFTs;
