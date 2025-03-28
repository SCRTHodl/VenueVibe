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
  id: string;
  user_id: string;
  caption?: string;
  content_url?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  filter?: string;
  expires_at?: string;
  viewed?: boolean;
  viewed_by?: string[];
  is_premium?: boolean;
  unlock_cost?: number;
  is_monetized?: boolean;
  monetization_status?: string;
  moderation_status?: string;
  visibility?: string;
  gifts?: number;
  analytics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  tags?: string[];
  comments?: {
    count: number;
    latest: Array<{
      id: string;
      user_id: string;
      content: string;
      created_at: string;
    }>;
  };
  stickers?: Array<{
    id: string;
    x: number;
    y: number;
    emoji: string;
  }>;
}

// Content moderation result type
export interface ModerationResult {
  isModerated: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
  flaggedContent?: string[];
  suggestedAction?: string;
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
  start_date: string;
  end_date: string;
  location: string;
  theme?: EventTheme;
  special_offers: SpecialOffer[];
  created_at: string;
  updated_at: string;
  updated_by: string;
  is_active: boolean;
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