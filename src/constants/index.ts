import type { Channel, Group, Post, EventTheme, TrendingTopic, LocalEvent, AIRecommendation } from '../types';

// Event themes for special occasions
export const EVENT_THEMES: EventTheme[] = [
  {
    id: 'march-madness',
    name: 'March Madness Basketball',
    description: 'College basketball tournament events and watch parties',
    primaryColor: '#FF4500', // Basketball orange
    secondaryColor: '#000000', // Black
    accentColor: '#FFD700', // Gold
    bannerUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&h=400&fit=crop',
    startDate: '2025-03-15',
    endDate: '2025-04-07',
    isActive: true
  },
  {
    id: 'spring-training',
    name: 'SottoCity',
    description: 'Special baseball spring training events and activities',
    primaryColor: '#1E88E5',
    secondaryColor: '#004D98',
    accentColor: '#FF6B00',
    bannerUrl: 'https://images.unsplash.com/photo-1562077772-3bd90403f7f0?w=1200&h=400&fit=crop',
    startDate: '2025-02-21',
    endDate: '2025-03-30',
    isActive: true
  },
  {
    id: 'first-friday',
    name: 'First Friday Art Walk',
    description: 'Downtown Phoenix art walk featuring galleries and street vendors',
    primaryColor: '#6A1B9A',
    secondaryColor: '#38006B',
    accentColor: '#F06292',
    bannerUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=1200&h=400&fit=crop',
    startDate: '2025-03-07',
    endDate: '2025-03-07',
    isActive: false
  },
  {
    id: 'suns-playoff',
    name: 'Suns Playoff Run',
    description: 'Playoff basketball activities and watch parties',
    primaryColor: '#FF9800',
    secondaryColor: '#7A0019',
    accentColor: '#E65100',
    bannerUrl: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=1200&h=400&fit=crop',
    startDate: '2025-04-20',
    endDate: '2025-06-15',
    isActive: false
  }
];

export const TEST_GROUPS: Group[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Cibo Urban Pizzeria',
    description: 'Rustic Italian restaurant with wood-fired pizzas and handmade pasta in a historic bungalow with a cozy patio.',
    latitude: 33.4942,
    longitude: -111.9261,
    participants: 87,
    time: 'Opens 11AM - 11PM',
    category: 'italian',
    rating: 4.7,
    priceRange: '$$',
    photos: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop'
    ],
    popularTimes: {
      now: 'Busy',
      trend: 'up',
      waitTime: '30-45 min'
    },
    inviteCode: 'CIBO2025',
    eventTheme: EVENT_THEMES[1]
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'The Churchill Social',
    description: 'Hip bar with craft cocktails, local brews and innovative small plates in a spacious industrial setting with a buzzing patio.',
    latitude: 33.5997,
    longitude: -111.7631,
    participants: 142,
    time: 'Opens 4PM - 2AM',
    category: 'bar',
    rating: 4.8,
    priceRange: '$$$',
    photos: [
      'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555658636-6e4a36218be7?w=800&h=600&fit=crop'
    ],
    popularTimes: {
      now: 'Very Busy',
      trend: 'up',
      waitTime: '45-60 min'
    },
    inviteCode: 'CHURCHILL25',
    eventTheme: EVENT_THEMES[1]
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Culinary Dropout',
    description: 'Trendy gastropub serving creative comfort food, craft beer & cocktails in a vibrant space with games & live music.',
    latitude: 33.6401,
    longitude: -111.9066,
    participants: 203,
    time: 'Opens 11AM - 12AM',
    category: 'gastropub',
    rating: 4.5,
    priceRange: '$$',
    photos: [
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=800&h=600&fit=crop'
    ],
    popularTimes: {
      now: 'Steady',
      trend: 'stable',
      waitTime: '15-30 min'
    },
    inviteCode: 'DROPOUT25'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    name: 'Postino Wine Cafe',
    description: 'Relaxed wine bar featuring bruschetta boards, panini & other light bites in a historic converted post office.',
    latitude: 33.4922,
    longitude: -111.9292,
    participants: 156,
    time: 'Opens 11AM - 11PM',
    category: 'wine-bar',
    rating: 4.6,
    priceRange: '$$',
    photos: [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=600&fit=crop'
    ],
    popularTimes: {
      now: 'Busy',
      trend: 'up',
      waitTime: '20-35 min'
    },
    inviteCode: 'POSTINO25'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    name: 'La Barquita',
    description: 'Vibrant Mexican restaurant known for fresh seafood, street tacos & craft margaritas in a colorful setting.',
    latitude: 33.4502,
    longitude: -111.9834,
    participants: 178,
    time: 'Opens 10AM - 10PM',
    category: 'latin',
    rating: 4.7,
    priceRange: '$$',
    photos: [
      'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?w=800&h=600&fit=crop'
    ],
    popularTimes: {
      now: 'Very Busy',
      trend: 'up',
      waitTime: '40-55 min'
    },
    inviteCode: 'BARQUITA25'
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-001',
    userId: 'user-123',
    userName: 'Jessica',
    userAvatar: 'J',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    venue: TEST_GROUPS[0],
    content: "Just had the most amazing margherita pizza at Cibo! The crust is perfectly thin and crispy. Definitely coming back next weekend! 🍕😍",
    photos: [TEST_GROUPS[0].photos[0]],
    likes: 37,
    comments: 8,
    isLiked: false,
    isSaved: true,
    tags: ['pizza', 'italianfood', 'datenight']
  },
  {
    id: 'post-002',
    userId: 'user-456',
    userName: 'Michael',
    userAvatar: 'M',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    venue: TEST_GROUPS[1],
    content: "Happy hour at The Churchill is 🔥! $5 craft beers and half-price appetizers. Got here just in time to snag the last outdoor table. Perfect weather tonight!",
    photos: [TEST_GROUPS[1].photos[1]],
    likes: 42,
    comments: 14,
    isLiked: true,
    isSaved: false,
    tags: ['happyhour', 'craftbeer', 'patiosituation']
  },
  {
    id: 'post-003',
    userId: 'user-789',
    userName: 'Sophia',
    userAvatar: 'S',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    venue: TEST_GROUPS[2],
    content: "Culinary Dropout's pretzel fondue with provolone cheese sauce is literally what dreams are made of. Also their cocktail game is next level. Try the Desert Sunset if you go!",
    photos: [TEST_GROUPS[2].photos[0]],
    likes: 89,
    comments: 23,
    isLiked: false,
    isSaved: false,
    tags: ['foodie', 'cocktails', 'gastropub']
  },
  {
    id: 'post-004',
    userId: 'user-101',
    userName: 'Carlos',
    userAvatar: 'C',
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
    venue: TEST_GROUPS[0],
    content: "Wine Wednesday at Cibo is such a steal! $5 glasses until 5pm and their bruschetta boards are perfect for sharing. Got the burrata and the sweet potato versions - both incredible!",
    photos: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop'],
    likes: 56,
    comments: 11,
    isLiked: true,
    isSaved: true,
    tags: ['winewednesday', 'happyhour', 'datespot']
  },
  {
    id: 'post-005',
    userId: 'user-202',
    userName: 'Olivia',
    userAvatar: 'O',
    createdAt: new Date(Date.now() - 270 * 60000).toISOString(),
    venue: TEST_GROUPS[1],
    content: "The Churchill's new seasonal cocktail menu is a must-try! The bartenders are so creative and they use all local ingredients. My favorite is the Sonoran Sunset with prickly pear and mezcal. 🍸✨",
    photos: ['https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&h=600&fit=crop'],
    likes: 112,
    comments: 29,
    isLiked: false,
    isSaved: true,
    tags: ['cocktails', 'local', 'nightlife', 'datenight']
  },
  {
    id: 'post-006',
    userId: 'user-303',
    userName: 'Emma',
    userAvatar: 'E',
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    venue: TEST_GROUPS[3],
    content: "Sunday Funday at Postino! $5 mimosas and the best bruschetta board in town. The fig & ricotta combo is heavenly! 🥂✨",
    photos: ['https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=800&h=600&fit=crop'],
    likes: 73,
    comments: 16,
    isLiked: false,
    isSaved: false,
    tags: ['sundayfunday', 'brunch', 'mimosas', 'winebar']
  },
  {
    id: 'post-007',
    userId: 'user-404',
    userName: 'Alex',
    userAvatar: 'A',
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    venue: TEST_GROUPS[4],
    content: "These fish tacos at La Barquita are INSANE! So fresh and that chipotle crema 🤤 Plus, their house margaritas are 2-for-1 until 6pm! 🌮🌶️",
    photos: ['https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop'],
    likes: 95,
    comments: 21,
    isLiked: true,
    isSaved: false,
    tags: ['tacos', 'mexicanfood', 'happyhour', 'margaritas']
  },
  {
    id: 'post-008',
    userId: 'user-505',
    userName: 'Ryan',
    userAvatar: 'R',
    createdAt: new Date(Date.now() - 150 * 60000).toISOString(),
    venue: TEST_GROUPS[2],
    content: "Live music night at Culinary Dropout! The band is killing it and these craft cocktails are perfect. Get the smoked old fashioned - it's a show! 🎸🥃",
    photos: ['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop'],
    likes: 128,
    comments: 32,
    isLiked: false,
    isSaved: true,
    tags: ['livemusic', 'nightlife', 'cocktails', 'datenight']
  },
  {
    id: 'post-009',
    userId: 'user-606',
    userName: 'Isabella',
    userAvatar: 'I',
    createdAt: new Date(Date.now() - 210 * 60000).toISOString(),
    venue: TEST_GROUPS[1],
    content: "The Churchill's rooftop movie night is such a vibe! Watching Casablanca under the stars with these amazing city views. Plus the popcorn is truffle-seasoned! 🎬🌟",
    photos: ['https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&h=600&fit=crop'],
    likes: 156,
    comments: 27,
    isLiked: true,
    isSaved: true,
    tags: ['movienight', 'rooftop', 'datenight', 'views']
  },
  {
    id: 'post-010',
    userId: 'user-707',
    userName: 'David',
    userAvatar: 'D',
    createdAt: new Date(Date.now() - 300 * 60000).toISOString(),
    venue: TEST_GROUPS[3],
    content: "$25 bottle of wine + board of bruschetta deal at Postino's is unbeatable! Perfect spot for a casual date night or catch-up with friends. The prosciutto & fig bruschetta is a must-try! 🍷",
    photos: ['https://images.unsplash.com/photo-1515779122185-65987783cb6a?w=800&h=600&fit=crop'],
    likes: 92,
    comments: 19,
    isLiked: false,
    isSaved: false,
    tags: ['winewednesday', 'datenight', 'bruschetta', 'winedeals']
  }
];

// New local events data
export const LOCAL_EVENTS: LocalEvent[] = [
  {
    id: 'event-001',
    title: 'Downtown Farmers Market',
    description: 'Weekly farmers market featuring local produce, artisanal foods, and handcrafted goods.',
    location: 'Phoenix Public Market',
    latitude: 33.4553,
    longitude: -112.0741,
    startDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    endDate: new Date(Date.now() + 86400000 * 2 + 14400000).toISOString(), // 2 days from now + 4 hours
    attendees: 187,
    category: 'market',
    tags: ['local', 'food', 'market', 'shopping'],
    image: 'https://images.unsplash.com/photo-1595073335377-bc5473781cb8?w=800&h=600&fit=crop',
    isFeatured: true
  },
  {
    id: 'event-002',
    title: 'Live Jazz at The Nash',
    description: 'Enjoy an evening of live jazz music featuring local and national artists in an intimate setting.',
    location: 'The Nash',
    latitude: 33.4583,
    longitude: -112.0731,
    startDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
    endDate: new Date(Date.now() + 86400000 * 3 + 10800000).toISOString(), // 3 days from now + 3 hours
    attendees: 78,
    category: 'music',
    tags: ['jazz', 'music', 'nightlife', 'entertainment'],
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop',
    isFeatured: false
  },
  {
    id: 'event-003',
    title: 'Desert Botanical Garden Night Lights',
    description: 'Experience the beauty of the desert at night with thousands of twinkling lights illuminating the garden paths.',
    location: 'Desert Botanical Garden',
    latitude: 33.4627,
    longitude: -111.9447,
    startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endDate: new Date(Date.now() + 86400000 + 14400000).toISOString(), // Tomorrow + 4 hours
    attendees: 243,
    category: 'outdoor',
    tags: ['nature', 'outdoor', 'lights', 'family'],
    image: 'https://images.unsplash.com/photo-1484503793037-5c9644d6a80a?w=800&h=600&fit=crop',
    isFeatured: true
  }
];

// Trending topics data
export const TRENDING_TOPICS: TrendingTopic[] = [
  {
    id: 'trend-001',
    title: 'First Friday Art Walk',
    description: 'Monthly art walk in downtown Phoenix featuring galleries, street vendors, and food trucks.',
    mentions: 1872,
    trend: 'up',
    percentChange: 35,
    category: 'event',
    tags: ['art', 'downtown', 'culture'],
    image: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?w=800&h=600&fit=crop'
  },
  {
    id: 'trend-002',
    title: 'Roosevelt Row Murals',
    description: 'New street art murals in the Roosevelt Row Arts District getting attention on social media.',
    mentions: 891,
    trend: 'up',
    percentChange: 43,
    category: 'attraction',
    tags: ['art', 'mural', 'streetart', 'photography'],
    image: 'https://images.unsplash.com/photo-1530495778878-d0233811ea29?w=800&h=600&fit=crop'
  },
  {
    id: 'trend-003',
    title: 'Camelback Mountain Sunrise Hike',
    description: 'Early morning hikes up Camelback Mountain becoming popular for spectacular sunrise views.',
    mentions: 1245,
    trend: 'up',
    percentChange: 28,
    category: 'activity',
    tags: ['hiking', 'fitness', 'sunrise', 'outdoors'],
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop'
  }
];

// AI-generated recommendations
export const AI_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: 'ai-rec-001',
    title: 'Morning Itinerary for Coffee Lovers',
    description: 'Start your day right with this curated tour of local coffee spots based on your preferences.',
    items: [
      {
        name: 'Cartel Coffee Lab',
        description: 'Third-wave coffee in an industrial space with house-roasted beans.',
        latitude: 33.4231,
        longitude: -111.9401,
        category: 'coffee',
        photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'
      },
      {
        name: 'Lux Central',
        description: 'Hip coffeehouse with pastries, cocktails & creative workspace.',
        latitude: 33.4977,
        longitude: -112.0756,
        category: 'coffee',
        photo: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop'
      },
      {
        name: 'Press Coffee Roasters',
        description: 'Specialty coffee shop known for their cold brew and avocado toast.',
        latitude: 33.5159,
        longitude: -111.9253,
        category: 'coffee',
        photo: 'https://images.unsplash.com/photo-1515442261605-65987783cb6a?w=800&h=600&fit=crop'
      }
    ],
    generatedAt: new Date().toISOString(),
    matchScore: 92,
    userInterests: ['coffee', 'breakfast', 'morning']
  }
];

export const channels: Channel[] = [
  {
    id: 'general',
    name: 'Social Feed',
    icon: 'layout-dashboard',
    description: 'Latest posts and activity'
  },
  {
    id: 'location',
    name: 'Location Info',
    icon: 'map-pinned',
    description: 'Find directions and details'
  },
  {
    id: 'signup',
    name: 'Reservations',
    icon: 'calendar-clock',
    description: 'Book a table or join waitlist'
  },
  {
    id: 'ai',
    name: 'Recommendations',
    icon: 'sparkles',
    description: 'Personalized suggestions'
  }
];