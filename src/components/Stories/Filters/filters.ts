// Define filter styles with better visibility and mobile optimization
export const STORY_FILTERS = [
  { 
    id: 'none', 
    name: 'Normal', 
    style: 'none',
    preview: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop'
  },
  { 
    id: 'vintage', 
    name: 'Vintage', 
    style: 'sepia(0.5) contrast(1.2) brightness(1.1)',
    preview: 'https://images.unsplash.com/photo-1571172964276-91faaa704e1f?w=100&h=100&fit=crop'
  },
  { 
    id: 'b&w', 
    name: 'B&W', 
    style: 'grayscale(1) contrast(1.2)',
    preview: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=100&h=100&fit=crop'
  },
  { 
    id: 'vivid', 
    name: 'Vivid', 
    style: 'saturate(1.8) contrast(1.1) brightness(1.1)',
    preview: 'https://images.unsplash.com/photo-1520962922320-2038eebab146?w=100&h=100&fit=crop'
  },
  { 
    id: 'cool', 
    name: 'Cool', 
    style: 'hue-rotate(30deg) saturate(1.2) brightness(1.1)',
    preview: 'https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=100&h=100&fit=crop'
  },
  { 
    id: 'warm', 
    name: 'Warm', 
    style: 'sepia(0.3) saturate(1.4) brightness(1.05)',
    preview: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=100&h=100&fit=crop'
  },
  { 
    id: 'dramatic', 
    name: 'Dramatic', 
    style: 'contrast(1.4) brightness(0.9) saturate(1.1)',
    preview: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=100&h=100&fit=crop'
  },
  { 
    id: 'fade', 
    name: 'Fade', 
    style: 'brightness(1.2) contrast(0.9) saturate(0.8)',
    preview: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=100&h=100&fit=crop'
  }
];