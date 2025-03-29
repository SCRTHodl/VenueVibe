import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PromotionSettings, SpecialEvent } from '../types';
import { toast } from 'react-hot-toast';

interface PromotionContextType {
  promotionSettings: PromotionSettings | null;
  specialEvents: SpecialEvent[];
  loading: boolean;
  error: string | null;
  fetchPromotionSettings: () => Promise<void>;
  updatePromotionSettings: (settings: Partial<PromotionSettings>) => Promise<void>;
  fetchSpecialEvents: () => Promise<void>;
  createSpecialEvent: (event: Partial<SpecialEvent>) => Promise<void>;
  updateSpecialEvent: (eventId: string, updates: Partial<SpecialEvent>) => Promise<void>;
  deleteSpecialEvent: (eventId: string) => Promise<void>;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

export const usePromotion = () => {
  const context = useContext(PromotionContext);
  if (context === undefined) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
};

export const PromotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [promotionSettings, setPromotionSettings] = useState<PromotionSettings | null>(null);
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotionSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('te_promotion_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;
      setPromotionSettings(data as PromotionSettings);
    } catch (err) {
      console.error('Error fetching promotion settings:', err);
      setError('Failed to fetch promotion settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePromotionSettings = async (settings: Partial<PromotionSettings>) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('te_promotion_settings')
        .update(settings)
        .eq('id', 1);

      if (error) throw error;
      
      // Update local state
      setPromotionSettings(prev => 
        prev ? { ...prev, ...settings } : null
      );

      toast.success('Promotion settings updated successfully');
    } catch (err) {
      console.error('Error updating promotion settings:', err);
      setError('Failed to update promotion settings');
      toast.error('Failed to update promotion settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('special_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSpecialEvents(data as SpecialEvent[]);
    } catch (err) {
      console.error('Error fetching special events:', err);
      setError('Failed to fetch special events');
    } finally {
      setLoading(false);
    }
  };

  const createSpecialEvent = async (event: Partial<SpecialEvent>) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('special_events')
        .insert({
          ...event,
          created_at: new Date().toISOString(),
          updatedBy: 'admin',
          isActive: true
        });

      if (error) throw error;
      
      // Refresh the events list
      await fetchSpecialEvents();
      toast.success('Special event created successfully');
    } catch (err) {
      console.error('Error creating special event:', err);
      setError('Failed to create special event');
      toast.error('Failed to create special event');
    } finally {
      setLoading(false);
    }
  };

  const updateSpecialEvent = async (eventId: string, updates: Partial<SpecialEvent>) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('special_events')
        .update({
          ...updates,
          updatedBy: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;
      
      // Refresh the events list
      await fetchSpecialEvents();
      toast.success('Special event updated successfully');
    } catch (err) {
      console.error('Error updating special event:', err);
      setError('Failed to update special event');
      toast.error('Failed to update special event');
    } finally {
      setLoading(false);
    }
  };

  const deleteSpecialEvent = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('special_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      // Refresh the events list
      await fetchSpecialEvents();
      toast.success('Special event deleted successfully');
    } catch (err) {
      console.error('Error deleting special event:', err);
      setError('Failed to delete special event');
      toast.error('Failed to delete special event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotionSettings();
    fetchSpecialEvents();
  }, []);

  return (
    <PromotionContext.Provider
      value={{
        promotionSettings,
        specialEvents,
        loading,
        error,
        fetchPromotionSettings,
        updatePromotionSettings,
        fetchSpecialEvents,
        createSpecialEvent,
        updateSpecialEvent,
        deleteSpecialEvent
      }}
    >
      {children}
    </PromotionContext.Provider>
  );
};
