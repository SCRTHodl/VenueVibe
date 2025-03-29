export interface EventItem {
  id: string;
  event_id: string;
  user_id: string;
  metadata?: {
    last_used?: string;
    [key: string]: any;
  };
}

export interface EventNFT extends EventItem {
  owner_id: string;
}

export interface EventBadge extends EventItem {
  badge_type: 'attendance' | 'participant' | 'contributor';
}
