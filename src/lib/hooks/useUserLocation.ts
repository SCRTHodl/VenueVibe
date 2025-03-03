import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserLocation } from '../../types';

export const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const watchLocation = () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: UserLocation = {
            id: 'current',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            lastActive: Date.now()
          };
          
          setLocation(newLocation);
          updateLocationInDb(newLocation);
        },
        (err) => {
          console.error('Location error:', err);
          setError('Unable to get your location');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    };

    watchLocation();
  }, []);

  const updateLocationInDb = async (location: UserLocation) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await supabase
          .from('user_locations')
          .upsert({
            user_id: session.user.id,
            latitude: location.latitude,
            longitude: location.longitude,
            last_active: new Date().toISOString()
          });
      }
    } catch (err) {
      console.error('Error updating location:', err);
    }
  };

  return { location, error };
};