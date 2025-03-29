import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { SpecialEvent } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { EventNFT, EventBadge } from '../../../src/types/eventTypes';

interface EventStatsProps {
  event: SpecialEvent;
}

const EventStats: React.FC<EventStatsProps> = ({ event }) => {
  const [stats, setStats] = React.useState({
    nfts: 0,
    badges: 0,
    users: 0,
    activeUsers: 0,
  });

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        // Get all NFTs for this event
        const { data: nfts, error: nftError } = await supabase
          .from('event_nfts')
          .select('*')
          .eq('event_id', event.id);

        // Get all badges for this event
        const { data: badges, error: badgeError } = await supabase
          .from('event_badges')
          .select('*')
          .eq('event_id', event.id);

        if (nftError || badgeError) {
          throw nftError || badgeError;
        }

        // Get all unique user IDs from both NFTs and badges
        const userIds = new Set<string>();
        (nfts || []).forEach((nft: EventNFT) => userIds.add(nft.owner_id));
        (badges || []).forEach((badge: EventBadge) => userIds.add(badge.user_id));

        setStats({
          nfts: nfts?.length || 0,
          badges: badges?.length || 0,
          users: userIds.size,
          activeUsers: (nfts || []).filter((n: EventNFT) => n.metadata?.last_used).length,
        });
      } catch (error) {
        console.error('Error loading event stats:', error);
      }
    };

    loadStats();
  }, [event.id]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent>
          <div className="text-3xl font-bold">{stats.nfts}</div>
          <p className="text-sm text-gray-500">Total NFTs Minted</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div className="text-3xl font-bold">{stats.badges}</div>
          <p className="text-sm text-gray-500">Total Badges Awarded</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div className="text-3xl font-bold">{stats.users}</div>
          <p className="text-sm text-gray-500">Total Attendees</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <div className="text-3xl font-bold">{stats.activeUsers}</div>
          <p className="text-sm text-gray-500">Active Participants</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventStats;
