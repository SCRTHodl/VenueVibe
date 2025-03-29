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

export interface UserStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  media: {
    type: 'image' | 'video';
    url: string;
  }[];
  caption?: string;
  location?: string;
  music?: string;
  stickers?: {
    id: string;
    emoji: string;
    x: number;
    y: number;
  }[];
  filter?: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  viewedBy: string[];
  tokenBalance?: number;
  gifts?: Array<{
    type: string;
    from: string;
    timestamp: string;
  }>;
  moderationStatus?: 'approved' | 'pending' | 'rejected';
  isPremium?: boolean;
  unlockCost?: number;
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
  popularTimes?: {
    now: string;
    trend: 'up' | 'down' | 'stable';
    waitTime: string;
  };
  inviteCode?: string;
  eventTheme?: EventTheme;
}

export interface Channel {
  id: string;
  name: string;
  icon: string;
  description: string;
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

// Event theme type for special occasions
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

// Post type for venue feed
// Import the Post interface from main types file to keep definitions in sync
export type { Post } from '../types';

// Promotion Box for the admin panel
export interface PromotionBox {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
}

// Special Event for the admin panel
export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  venueId?: string;
  venueName?: string;
  imageUrl?: string;
  capacity?: number;
  inviteCode?: string;
  specialOffers: SpecialOffer[];
  theme?: EventTheme;
  isActive: boolean;
  createdAt: string;
  updatedBy: string;
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
  isEnabled: boolean;
  headingText?: string;
  subheadingText?: string;
  bannerText?: string;
  tokenReward?: number;
  promotionTheme?: EventTheme | null;
  moderationKeywords?: string[];
  contentFocus?: string;
  promotionalBoxes?: PromotionBox[];
  discountBoxes: PromotionBox[];
  promotionalImages: string[];
  specialOffer?: string;
  customBannerUrl?: string;
  specialEvents?: SpecialEvent[];
}

// Legacy Post interface - kept for reference but not used
// Remove after confirming all components use the main Post interface
/*
export interface LegacyPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: string;
  venue: Group;
  content: string;
  photos?: string[];
  likes: number;
  comments: number;
  isLiked?: boolean;
  isSaved?: boolean;
  tags?: string[];
}
*/