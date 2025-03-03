import React from 'react';
import { Marker } from 'react-map-gl';
import { motion } from 'framer-motion';

interface RydeQuestCarProps {
  driver: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isOutbound?: boolean;
    routeId?: string;
    pointIndex?: number;
    direction?: number;
  };
  onSelect: (driver: any) => void;
  scale?: number;
}

export const RydeQuestCar: React.FC<RydeQuestCarProps> = ({ 
  driver, 
  onSelect,
  scale = 1
}) => {
  const isOutbound = driver.isOutbound !== false; // default to outbound if not specified
  const carEmoji = "🚗"; // Simple car emoji
  
  return (
    <Marker
      key={driver.id}
      longitude={driver.longitude}
      latitude={driver.latitude}
      onClick={(e) => {
        e.originalEvent?.stopPropagation();
        onSelect(driver);
      }}
    >
      <motion.div
        className="relative cursor-pointer car-driving"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.2 }}
        transition={{ 
          scale: { duration: 0.3 }
        }}
      >
        <div className={`px-1.5 py-0.5 rounded-full text-xl ${
          isOutbound 
            ? 'bg-gradient-to-r from-blue-600/70 to-blue-500/70 shadow-blue-600/20 shadow-md' 
            : 'bg-gradient-to-r from-green-600/70 to-emerald-500/70 shadow-green-500/20 shadow-md'
        }`}>
          {carEmoji}
        </div>
      </motion.div>
    </Marker>
  );
};