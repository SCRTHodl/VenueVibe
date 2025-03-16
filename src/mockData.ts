import { User, Group } from './types';

/**
 * Mock Data for Development and Testing
 * 
 * This file contains sample data for development and testing purposes.
 * It includes mock users, posts, and groups that simulate real application data
 * without requiring a database connection.
 * 
 * Usage:
 * - Import the required mock data in your component:
 *   import { TEST_USERS, MOCK_POSTS, TEST_GROUPS } from '../mockData';
 * - Use the mock data for development and testing scenarios
 * 
 * Note: In production, these would be replaced with real data from the database.
 */

// Sample test users for development and testing
// In production, these would be replaced with real user data from the database
export const TEST_USERS: User[] = [
  {
    id: 'test-user-1',
    name: 'Test User 1',
    email: 'testuser1@example.com',
    avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=test-user-1',
    isAdmin: true, // Admin user for testing admin features
    tokens: 1000,
    lastLogin: new Date().toISOString(),
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      lastUpdated: new Date().toISOString()
    },
    settings: {
      locationRadius: 60,
      darkMode: false,
      notifications: true,
      maxResults: 50,
      autoRefresh: true,
      tokenRefreshEnabled: true,
      tokenRefreshInterval: 60
    }
  },
  {
    id: 'test-user-2',
    name: 'Test User 2',
    email: 'testuser2@example.com',
    avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=test-user-2',
    isAdmin: false,
    tokens: 500,
    lastLogin: new Date().toISOString(),
    location: {
      latitude: 37.3352,
      longitude: -121.8811,
      lastUpdated: new Date().toISOString()
    }
  },
  {
    id: 'test-user-3',
    name: 'Test User 3',
    email: 'testuser3@example.com',
    avatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=test-user-3',
    isAdmin: false,
    tokens: 100,
    lastLogin: new Date().toISOString()
  }
];

// Sample mock posts for development 
export const MOCK_POSTS = [
  {
    id: 'post-1',
    userId: 'test-user-1',
    content: 'This is a test post from the first test user',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: 15,
    comments: 3
  },
  {
    id: 'post-2',
    userId: 'test-user-2',
    content: 'Another test post from the second test user',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    likes: 8,
    comments: 1
  }
];

// Sample test groups for development and testing
export const TEST_GROUPS: Group[] = [
  {
    id: 'group-1',
    name: 'Coffee Enthusiasts',
    description: 'For everyone who loves great coffee and conversation',
    category: 'Social',
    participants: 42,
    time: new Date().toISOString(),
    latitude: 37.7749,
    longitude: -122.4194,
    rating: 4.8,
    priceRange: '$',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    popularTimes: {
      now: 'Busy',
      trend: 'up',
      waitTime: '~15 min'
    }
  },
  {
    id: 'group-2',
    name: 'Tech Meetup',
    description: 'Discussing the latest in tech and development',
    category: 'Technology',
    participants: 78,
    time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    latitude: 37.7833,
    longitude: -122.4167,
    rating: 4.5,
    priceRange: '$$',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    popularTimes: {
      now: 'Steady',
      trend: 'stable',
      waitTime: '~5 min'
    }
  },
  {
    id: 'group-3',
    name: 'Fitness Club',
    description: 'Join us for outdoor workouts and fitness tips',
    category: 'Health & Fitness',
    participants: 35,
    time: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    latitude: 37.7694,
    longitude: -122.4862,
    rating: 4.9,
    priceRange: '$$$',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    popularTimes: {
      now: 'Quiet',
      trend: 'down',
      waitTime: 'No wait'
    }
  }
];
