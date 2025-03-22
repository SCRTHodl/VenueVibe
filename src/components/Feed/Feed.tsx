import React from 'react';
import { Post as PostComponent } from '../Post/Post';
import { GroupCard } from '../Group/GroupCard';
import { PromoCard } from '../Promo/PromoCard';
import type { Post, Group } from '../../types';

interface FeedProps {
  posts: Post[];
  groups: Group[];
  onGroupSelect: (group: Group) => void;
  onMapViewToggle: () => void;
  selectedVenue?: {id: string, name: string} | null;
  onClearVenueSelection?: () => void;
}

export const Feed: React.FC<FeedProps> = ({ posts, groups, onGroupSelect, onMapViewToggle, selectedVenue, onClearVenueSelection }) => {
  // Interleave posts and group recommendations to create a mixed feed
  const createMixedFeed = () => {
    const feedItems: React.ReactNode[] = [];
    
    // Safety check to ensure we have posts and groups to work with
    if (!posts.length || !groups.length) {
      return feedItems;
    }
    
    // If we have a selected venue, add a header for venue-specific posts
    if (selectedVenue) {
      feedItems.push(
        <div key="venue-header" className="px-4 py-3 mb-2 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg shadow-lg relative">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{selectedVenue.name}</h2>
            <button 
              onClick={onClearVenueSelection} 
              className="text-xs bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-white transition-colors"
            >
              View All Posts
            </button>
          </div>
          <p className="text-blue-200 text-sm">View location-specific posts and join the conversation</p>
        </div>
      );
    }
    
    // Add posts to feed
    const filteredPosts = selectedVenue 
      ? posts.filter(post => post.venue?.id === selectedVenue.id)
      : posts;
      
    // If we're filtering by venue and have no posts, show a message
    if (selectedVenue && filteredPosts.length === 0) {
      feedItems.push(
        <div key="no-venue-posts" className="px-4 py-6 bg-[--color-card-bg] rounded-xl shadow-lg text-center my-4">
          <p className="text-[--color-text-secondary] mb-4">No posts yet for this location</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Be the first to post
          </button>
        </div>
      );
    }
      
    filteredPosts.forEach((post, index) => {
      // Add post
      feedItems.push(
        <PostComponent key={`post-${post.id}`} post={post} />
      );
      
      // After every 2 posts, add a group recommendation
      if (index % 2 === 1 && index < posts.length - 1) {
        const groupIndex = (index / 2) % groups.length;
        const group = groups[groupIndex];
        
        // Make sure we have a valid group before adding it
        if (group) {
          feedItems.push(
            <GroupCard 
              key={`group-${group.id}`} 
              group={group} 
              onSelect={() => onGroupSelect(group)}
              showMapButton={index === 1} // Show map button on first group card
              onMapViewToggle={onMapViewToggle}
            />
          );
          
          // Add a promo occasionally
          if (index === 3 && groups.length > 1) {
            feedItems.push(
              <PromoCard 
                key="promo-card"
                title="Summer Cocktail Festival"
                venue={groups[1]}
                promoCode="SUMMER25"
                discount="25% off"
              />
            );
          }
        }
      }
    });
    
    return feedItems;
  };
  
  return (
    <div className="p-3 space-y-4">
      {createMixedFeed()}
    </div>
  );
};