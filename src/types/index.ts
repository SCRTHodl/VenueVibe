// Add Rating type to types/index.ts
interface Rating {
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
}

interface ModerationResult {
  status: 'approved' | 'pending' | 'rejected';
  score: number;
  categories: {
    spam: number;
    offensive: number;
    adult: number;
    violence: number;
  };
}