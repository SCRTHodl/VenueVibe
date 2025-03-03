import React from 'react';
import { LocationInfo } from './LocationInfo';
import { EventSignup } from './EventSignup';
import { SocialFeed } from './SocialFeed';
import { RecommendationsAI } from './RecommendationsAI';
import { MOCK_POSTS } from '../../constants';
import type { Message, Group, Channel } from '../../types';

interface ChannelContentProps {
  channel: Channel['id'];
  messages: Message[];
  group: Group;
  isLoading: boolean;
}

export const ChannelContent: React.FC<ChannelContentProps> = ({
  channel,
  messages,
  group,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  switch (channel) {
    case 'general':
      // Filter posts for this venue
      const relevantPosts = MOCK_POSTS.filter(post => 
        post.venue.id === group.id || Math.random() > 0.5 // Show this venue's posts + some random ones
      );
      return <SocialFeed posts={relevantPosts} />;
    case 'location':
      return <LocationInfo group={group} />;
    case 'signup':
      return <EventSignup group={group} />;
    case 'ai':
      return <RecommendationsAI group={group} />;
    default:
      return <SocialFeed posts={MOCK_POSTS} />;
  }
};