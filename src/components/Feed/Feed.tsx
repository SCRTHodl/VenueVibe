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
}

export const Feed: React.FC<FeedProps> = ({ posts, groups, onGroupSelect, onMapViewToggle }) => {
  // Interleave posts and group recommendations to create a mixed feed
  const createMixedFeed = () => {
    const feedItems = [];
    
    // Safety check to ensure we have posts and groups to work with
    if (!posts.length || !groups.length) {
      return feedItems;
    }
    
    // Add posts to feed
    posts.forEach((post, index) => {
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