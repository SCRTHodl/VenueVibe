import React from 'react';
import { Calendar, MapPin, Users, Clock, ChevronRight } from 'lucide-react';
import { LocalEvent } from '../../types';
import { motion } from 'framer-motion';

interface LocalEventsSectionProps {
  events: LocalEvent[];
}

export const LocalEventsSection: React.FC<LocalEventsSectionProps> = ({ events }) => {
  // Format date to show only the day and time
  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="relative mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-white text-lg flex items-center gap-2">
          <Calendar size={18} className="text-[--color-accent-primary]" />
          Local Events
        </h2>
        <button className="text-sm text-[--color-accent-primary] flex items-center">
          View All <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex gap-3">
          {events.map((event) => (
            <LocalEventCard 
              key={event.id} 
              event={event} 
              formatEventTime={formatEventTime}
              formatEventDate={formatEventDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface LocalEventCardProps {
  event: LocalEvent;
  formatEventTime: (dateString: string) => string;
  formatEventDate: (dateString: string) => string;
}

const LocalEventCard: React.FC<LocalEventCardProps> = ({ 
  event, 
  formatEventTime,
  formatEventDate 
}) => {
  return (
    <motion.div 
      className="relative min-w-[280px] max-w-[280px] rounded-xl overflow-hidden shadow-lg border border-[--color-accent-primary]/10 bg-[#121826]/90"
      whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="h-40 relative">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        
        {event.isFeatured && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            Featured Event
          </div>
        )}
        
        <div className="absolute bottom-2 left-2 text-white text-sm font-medium backdrop-blur-sm bg-black/40 px-2 py-1 rounded">
          {formatEventDate(event.startDate)}
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-white mb-1">{event.title}</h3>
        <p className="text-xs text-gray-300 mb-2 line-clamp-2">{event.description}</p>
        
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-gray-300">
            <Clock size={12} className="text-[--color-accent-primary]" />
            <span>{formatEventTime(event.startDate)} - {formatEventTime(event.endDate)}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-gray-300">
            <MapPin size={12} className="text-[--color-accent-primary]" />
            <span>{event.location}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-gray-300">
            <Users size={12} className="text-[--color-accent-primary]" />
            <span>{event.attendees} attending</span>
          </div>
        </div>
        
        <div className="mt-3 flex justify-end">
          <button className="bg-gradient-to-r from-[--color-accent-primary] to-[--color-accent-secondary] hover:opacity-90 px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg">
            Join Event
          </button>
        </div>
      </div>
    </motion.div>
  );
};