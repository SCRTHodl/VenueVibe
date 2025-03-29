import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SpecialEvent } from '../types';

interface EventContextType {
  event: SpecialEvent | null;
  loadEvent: (eventId: string) => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [event, setEvent] = useState<SpecialEvent | null>(null);

  const loadEvent = async (eventId: string) => {
    try {
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent({
        ...eventData,
        startTime: eventData.startTime || '',
        endTime: eventData.endTime || '',
        nftImage: eventData.nftImage || '',
        createdAt: eventData.createdAt || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  return (
    <EventContext.Provider value={{ event, loadEvent }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
