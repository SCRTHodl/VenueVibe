import React from 'react';
import { CalendarClock, MapPin, Users, Tag, Clock, ExternalLink, QrCode } from 'lucide-react';
import { PromoEvent } from '../../types';
import { formatTimeAgo } from '../../lib/utils';

interface PromoDetailsProps {
  event: PromoEvent;
  onClose: () => void;
}

export const PromoDetails: React.FC<PromoDetailsProps> = ({ event, onClose }) => {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getProgressColor = () => {
    const percentFull = (event.currentAttendees / (event.attendeeLimit || event.currentAttendees * 1.5)) * 100;
    if (percentFull > 80) return 'bg-red-600';
    if (percentFull > 50) return 'bg-yellow-600';
    return 'bg-green-600';
  };
  
  const progressBarWidth = `${Math.min(100, (event.currentAttendees / (event.attendeeLimit || event.currentAttendees * 1.5)) * 100)}%`;
  
  return (
    <div className="bg-[#121826] rounded-lg border border-blue-900/50 overflow-hidden shadow-xl">
      {/* Event header with image */}
      <div className="relative h-40 bg-gradient-to-r from-blue-900 to-indigo-900">
        {event.venue.photos && event.venue.photos.length > 0 && (
          <img 
            src={event.venue.photos[0]} 
            alt={event.title} 
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#121826] to-transparent">
          <h2 className="text-white font-bold text-xl">{event.title}</h2>
          <div className="flex items-center text-gray-300 text-sm gap-2">
            <MapPin size={14} className="text-blue-400" />
            <span>{event.venue.name}</span>
          </div>
        </div>
      </div>
      
      {/* Event details */}
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-blue-900/40 text-blue-300 rounded text-xs flex items-center gap-1">
            <Tag size={12} />
            {event.status.toUpperCase()}
          </span>
          <span className="px-2 py-1 bg-blue-900/40 text-blue-300 rounded text-xs flex items-center gap-1">
            <QrCode size={12} />
            {event.promoCode}
          </span>
        </div>
        
        <p className="text-gray-300 text-sm">{event.description}</p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-300">
            <CalendarClock size={16} className="text-blue-400" />
            <div className="text-sm">
              <div>{formatDate(startDate)} - {formatDate(endDate)}</div>
              <div className="text-xs text-gray-400">
                {event.venue.time.replace('Opens ', '')}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-gray-300">
            <Tag size={16} className="text-green-400" />
            <div className="text-sm font-medium text-green-300">{event.benefit}</div>
          </div>
          
          {event.attendeeLimit && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <div className="text-gray-300 flex items-center gap-1">
                  <Users size={14} className="text-blue-400" />
                  <span>{event.currentAttendees} attending</span>
                </div>
                {event.attendeeLimit && (
                  <div className="text-gray-400">
                    {event.attendeeLimit - event.currentAttendees} spots left
                  </div>
                )}
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor()}`} 
                  style={{ width: progressBarWidth }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3 text-gray-300">
            <div className="w-8 h-8 rounded-full bg-blue-900/40 flex items-center justify-center">
              {event.organizer.logo ? (
                <img 
                  src={event.organizer.logo} 
                  alt={event.organizer.name} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Users size={14} className="text-blue-400" />
              )}
            </div>
            <div className="text-sm">
              <div>Organized by</div>
              <div className="font-medium text-white">{event.organizer.name}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA buttons */}
      <div className="p-4 border-t border-blue-900/30 flex gap-3">
        <button 
          onClick={onClose}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm transition-colors"
        >
          Close
        </button>
        <button 
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink size={14} />
          View Details
        </button>
      </div>
    </div>
  );
};