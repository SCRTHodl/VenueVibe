import React from 'react';
import { Marker } from 'react-map-gl';
import { motion } from 'framer-motion';
import { Circle } from 'lucide-react';
import { UserLocation } from '../../types';

interface UserMarkerProps {
  user: UserLocation;
  scale?: number;
}

export const UserMarker: React.FC<UserMarkerProps> = ({ user, scale = 1 }) => {
  const isActive = Date.now() - user.lastActive < 300000;
  
  return (
    <Marker
      latitude={user.latitude}
      longitude={user.longitude}
    >
      <motion.div 
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      >
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full bg-purple-500/40"
            animate={{ 
              scale: [1, 2.5, 1],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
        )}
        <Circle 
          size={14 * scale} 
          className="text-purple-400 drop-shadow-glow" 
          fill="#a855f7"
          strokeWidth={1}
        />
      </motion.div>
    </Marker>
  );
};