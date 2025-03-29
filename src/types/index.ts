// Add Rating type to types/index.ts
export interface Rating {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  groupId: string;
  rating: number;
  review: string;
  photos?: string[];
  likes: number;
  replies: number;
  shares: number;
  isLiked?: boolean;
  isVerified?: boolean;
  createdAt: string;
  badges?: string[];
}

// UserStory interface that's comprehensive with all necessary properties
export interface UserStory {
  // Basic story identification and user info
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  
  // Media content - can be a string URL or an array of media objects
  media: string | {
    type: 'image' | 'video';
    url: string;
    width?: number;
    height?: number;
    duration?: number;
  }[];
  
  // Story content and metadata
  caption: string;
  location?: string;
  music?: string;
  tags?: string[];
  filter: string;
  timestamp: string;
  createdAt: string;
  expiresAt: string;
  updatedAt?: string;
  
  // Interactive elements
  stickers?: {
    id: string;
    emoji: string;
    x: number;
    y: number;
    scale?: number;
    rotation?: number;
  }[];
  
  // Engagement metrics
  viewed: boolean;
  viewCount: number;
  viewedBy: string[];
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  
  // Premium and token related properties
  isPremium?: boolean;
  unlockCost?: number;
  tokenBalance?: number;
  isMonetized?: boolean;
  monetizationStatus?: 'enabled' | 'disabled' | 'pending';
  
  // Moderation and visibility
  moderationStatus?: 'approved' | 'pending' | 'rejected';
  visibility?: 'public' | 'followers' | 'private';
  
  // Gifts and interactions
  gifts?: Array<{
    id?: string;
    type: string;
    from: string;
    amount?: number;
    timestamp: string;
  }>;
  
  // Additional context and metadata
  comment?: {
    text?: string;
    media?: string;
  };
  analytics?: {
    impressions?: number;
    engagement?: number;
    completionRate?: number;
    averageWatchTime?: number;
  };
}

// Content moderation result type
export interface ModerationResult {
  status: 'approved' | 'pending' | 'rejected';
  reason?: string;
  score: number;
  categories: {
    spam: number;
    offensive: number;
    adult: number;
    violence: number;
    [key: string]: number;
  };
  timestamp?: string;
}

// Chat & Group types for the map chat functionality
// Group activity type for map animations and activity indicators
export interface GroupActivity {
  id: string;
  type: string;
  userId: string;
  groupId: string;
  createdAt: string;
  level: number; // Required in the MapMarker component
  surgeCount: number; // Required in the MapMarker component
}

// Import PopularTimes from types.ts for compatibility
import type { PopularTimes } from '../types';

// Group interface compatible with both types.ts and local usage
export interface Group {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  participants: number;
  time: string;
  category: string;
  rating: number;
  priceRange: string;
  photos: string[];
  popularTimes: {
    now: string;
    trend: string;
    waitTime: string;
  };
  inviteCode: string;
  eventTheme: EventTheme;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  icon: string;
  members: number;
  messages: number;
  lastMessage: string;
  lastMessageTime: string;
  isPrivate: boolean;
  isMuted: boolean;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventTheme {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bannerUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface TrendingTopic {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  followers: number;
  posts: number;
  isTrending: boolean;
  trendScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalEvent {
  id: string;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  eventType: string;
  category: string;
  imageUrl: string;
  attendees: number;
  capacity: number;
  isFree: boolean;
  price: number;
  isFeatured: boolean;
  isCanceled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIRecommendation {
  id: string;
  userId: string;
  groupId: string;
  recommendationType: string;
  content: string;
  confidence: number;
  relevanceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  groupId: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  attachments?: {
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    thumbnail?: string;
  }[];
  reactions?: {
    type: string;
    count: number;
    users: string[];
  }[];
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
  isDeleted?: boolean;
  replyTo?: string;
}

// Post interface
export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
}

// Re-export Database type from database.types.ts
export type { Database } from './database.types';

// Promotion Box for the admin panel
export interface PromotionBox {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
}

export interface EventNFT {
  id: string;
  event_id: string;
  owner_id: string;
  metadata: {
    image: string;
    name: string;
    description: string;
    minted_at: string;
    owner: string;
  };
}

export interface EventBadge {
  id: string;
  event_id: string;
  user_id: string;
  badge_type: 'attendance' | 'participant' | 'contributor';
  metadata: {
    name: string;
    awarded_at: string;
    awardee: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  nftImage: string;
  createdAt: string;
}

// Special Offer type for events
export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discountAmount?: number;
  discountType?: 'percentage' | 'fixed' | 'tokenBased';
  tokenCost?: number;
  validFrom: string;
  validUntil: string;
  redemptionCode?: string;
  maxRedemptions?: number;
  currentRedemptions?: number;
  isActive: boolean;
}

// Promotion Settings interface
export interface PromotionSettings {
  id: number;
  is_enabled: boolean;
  token_reward: number;
  theme: EventTheme | null;
  moderation_keywords: string[];
  content_focus: string;
  promotional_boxes: any[];
  special_offer: string;
  custom_banner_url: string;
  heading_text: string;
  subheading_text: string;
  banner_text: string;
  discount_boxes: any[];
  promotional_images: any[];
  special_events: SpecialEvent[];
}