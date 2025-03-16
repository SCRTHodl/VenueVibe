/**
 * Formats a date into a human-readable time ago string
 * e.g. "2 minutes ago", "1 hour ago", etc.
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  return date.toLocaleDateString();
};

/**
 * Returns the current time of day greeting (Good morning, Good afternoon, etc.)
 */
const getTimeOfDayGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
};

/**
 * Generates a tailwind CSS class based on venue category
 */
export const getCategoryColor = (category?: string): string => {
  if (!category) return 'bg-gray-300 text-gray-700';
  
  const lowercased = category.toLowerCase();
  
  if (lowercased.includes('restaurant') || lowercased.includes('food') || lowercased.includes('cafe')) {
    return 'bg-orange-100 text-orange-800';
  } else if (lowercased.includes('bar') || lowercased.includes('pub') || lowercased.includes('lounge')) {
    return 'bg-purple-100 text-purple-800';
  } else if (lowercased.includes('shopping') || lowercased.includes('store') || lowercased.includes('market')) {
    return 'bg-blue-100 text-blue-800';
  } else if (lowercased.includes('hotel') || lowercased.includes('lodging') || lowercased.includes('inn')) {
    return 'bg-yellow-100 text-yellow-800';
  } else if (lowercased.includes('gym') || lowercased.includes('fitness') || lowercased.includes('sport')) {
    return 'bg-green-100 text-green-800';
  } else if (lowercased.includes('theater') || lowercased.includes('cinema') || lowercased.includes('entertainment')) {
    return 'bg-red-100 text-red-800';
  } else if (lowercased.includes('park') || lowercased.includes('nature') || lowercased.includes('garden')) {
    return 'bg-emerald-100 text-emerald-800';
  } else if (lowercased.includes('museum') || lowercased.includes('gallery') || lowercased.includes('art')) {
    return 'bg-indigo-100 text-indigo-800';
  }
  
  // Default fallback based on the first character of the category
  const colors = [
    'bg-pink-100 text-pink-800',
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-yellow-100 text-yellow-800',
    'bg-indigo-100 text-indigo-800',
    'bg-red-100 text-red-800',
    'bg-orange-100 text-orange-800',
  ];
  
  const charCode = category.charCodeAt(0) % colors.length;
  return colors[charCode];
};

/**
 * Generates a random color based on a string input (for user avatars)
 */
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
};

/**
 * Formats a number with K/M/B suffixes (e.g. 1.2K, 3.4M)
 */
const formatNumber = (num: number): string => {
  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else if (num < 1000000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
};

/**
 * Determines if two coordinates are within a specified distance in meters
 */
const areCoordinatesNearby = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number, 
  distanceInMeters: number = 1000
): boolean => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance <= distanceInMeters;
};

/**
 * Gets the user's current location if permission is granted
 */
const getUserLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    }
  });
};

/**
 * Returns a random avatar image URL
 */
const getRandomAvatarUrl = (userId: string): string => {
  const avatarStyles = ['micah', 'adventurer', 'avataaars', 'big-ears', 'bottts', 'croodles', 'personas'];
  const style = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
  return `https://avatars.dicebear.com/api/${style}/${userId}.svg`;
};