/**
 * Type definitions for the MapChat application
 */

export interface User {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  tokens?: number; // Token balance for the token economy
  settings?: UserSettings; // User preferences and settings
  isAdmin?: boolean; // Whether the user has admin privileges
  lastLogin?: string; // Last login timestamp
  location?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
}

export interface UserSettings {
  locationRadius: number; // Search radius in miles (default: 60)
  maxResults?: number; // Maximum number of results to show
  autoRefresh?: boolean; // Whether to automatically refresh when entering a new area
  notifications?: boolean; // Whether to receive notifications
  darkMode?: boolean; // UI preference
  tokenRefreshEnabled?: boolean; // Whether to automatically refresh tokens
  tokenRefreshInterval?: number; // Interval in minutes for token refresh
}

export interface Venue {
  id: string;
  name: string;
  category?: string;
  rating?: number;
  priceRange?: string;
  photos?: string[];
  popularTimes?: {
    now: string;
    trend: 'up' | 'down' | 'stable';
    waitTime: string;
  };
  time?: string; // Opening hours or event time
}

export interface Comment {
  id: string;
  text: string;
  content?: string; // Alternative to text
  user?: User;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  postId: string;
  likes?: number;
}

export interface Post {
  id: string;
  content: string;
  text?: string; // Alias for content for backward compatibility
  user?: User;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  venue?: Venue | Group; // Allow either Venue or Group reference
  venueId?: string;
  createdAt: string;
  likes?: number;
  image?: string;
  media?: string; // Alias for image for backward compatibility
  tags?: string[];
  comments: Comment[]; // Make comments an array, not optional
  photos?: string[];
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface PopularTimes {
  now: 'Very Busy' | 'Busy' | 'Steady' | 'Quiet';
  trend: 'up' | 'down' | 'stable';
  waitTime: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  participants: number;
  time: string;
  latitude: number;
  longitude: number;
  rating: number;
  priceRange: string;
  image?: string;
  popularTimes?: PopularTimes;
  venueId?: string;
}

export interface Message {
  id: string;
  user: User;
  text: string;
  timestamp: string;
  channel?: string;
  groupId: string;
}

export interface Channel {
  id: string;
  name: string;
  icon?: string; // Icon for the channel display
  description?: string; // Description for the channel
}

export type ActivityEvent = {
  id: string;
  type: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  target?: string;
  content?: string;
  createdAt: string;
  groupName?: string;   // For 'join' events
  badgeName?: string;   // For 'badge' events
  giftType?: string;    // For 'gift' events
  targetName?: string;  // For 'gift' and 'like' events
}

export type GroupActivity = {
  id: string;
  type: string;
  userId: string;
  groupId: string;
  createdAt: string;
  level?: number;
  surgeCount?: number;
}

export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
}

export type ViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface AppStatsType {
  subscriberCount: number;
  version: string;
  userCount?: number;
  storyCount?: number;
  topBalances?: Array<{user_id: string, balance: number}>;
  lastUpdated?: string;
}

export interface AppTheme {
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
  cardBackground?: string;
  textPrimary?: string;
  textSecondary?: string;
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
  fontFamily?: string;
  logoUrl?: string;
}

// UserStory interface has been moved to types/index.ts
// Use import { UserStory } from './types/index'; instead

export interface PromotionBox {
  title: string;
  description: string;
  discountText: string;
  isEnabled: boolean;
  displayOrder: number;
}

export interface DiscountBox {
  id: string;
  title: string;
  content: string;
  isEnabled?: boolean;
}

export interface PromotionSettings {
  isEnabled: boolean;
  tokenReward: number;
  promotionTheme: EventTheme;
  moderationKeywords: string[];
  contentFocus: string;
  promotionalBoxes: PromotionBox[];
  specialOffer: string; // For the "SPECIAL OFFER" text in EventBanner
  customBannerUrl?: string; // Optional custom banner image URL
  headingText?: string; // Promotional heading text
  subheadingText?: string; // Promotional subheading text
  discountBoxes?: DiscountBox[]; // List of discount boxes to display
  promotionalImages?: string[]; // List of promotional images to display
}

export interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  created_at?: string;
  expiry_date: string;
  max_uses: number;
  uses: number;
  is_active: boolean;
  themeId?: string; // Associated theme ID for this invite code
}

export interface TrendingTopic {
  id: string;
  title: string; // Title of the trending topic
  name?: string; // Optional name property (for backward compatibility)
  count?: number; // Number of mentions
  mentions?: number; // Alternative to count
  description?: string; // Description of the trending topic
  trend?: 'up' | 'down' | 'stable'; // Trend direction
  percentChange?: number; // Percentage change 
  category?: string; // Category of the topic
  isRising?: boolean; // Whether the topic is rising
  tags?: string[]; // Tags related to the topic
  image?: string; // Image URL
}

export interface LocalEvent {
  id: string;
  title: string; // Title of the event
  name?: string; // Optional name property (for backward compatibility)
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  attendees?: number;
  category?: string;
  tags?: string[];
  image?: string; // Image URL
  imageUrl?: string; // Alternative property for image URL
  url?: string;
  isFeatured?: boolean;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'venue' | 'event' | 'group';
  score: number;
  imageUrl?: string;
  targetId?: string;
  items?: any[]; // Items associated with the recommendation
  generatedAt?: string; // When the recommendation was generated
  matchScore?: number; // Score of the match
  userInterests?: string[]; // User interests used for the recommendation
}
