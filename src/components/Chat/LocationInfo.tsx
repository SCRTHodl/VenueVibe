import React from 'react';
import { MapPin, Navigation, Clock, Calendar } from 'lucide-react';
import type { Group } from '../../types';

interface LocationInfoProps {
  group: Group;
}

export const LocationInfo: React.FC<LocationInfoProps> = ({ group }) => {
  const getDirectionsUrl = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${group.latitude},${group.longitude}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-blue-500" />
          Meeting Location
        </h3>
        <div className="space-y-3">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <img
              src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+1d4ed8(${group.longitude},${group.latitude})/${group.longitude},${group.latitude},13,0/600x300@2x?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
              alt="Meeting location map"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={14} />
                <span>{group.time}</span>
              </div>
            </div>
            <a
              href={getDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <Navigation size={14} />
              Get Directions
            </a>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-blue-500" />
          Important Details
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Please arrive 10 minutes early</li>
          <li>• Parking available on-site</li>
          <li>• Look for the group coordinator wearing a blue badge</li>
          <li>• Bring water and comfortable shoes</li>
        </ul>
      </div>
    </div>
  );
};