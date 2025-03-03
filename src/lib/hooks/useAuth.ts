import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        setUserId(session?.user?.id || null);
        
        // Check admin status
        if (session?.user) {
          const { data } = await supabase
            .from('admin_panel.users')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
      
      if (session?.user) {
        const { data } = await supabase
          .from('admin_panel.users')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAuthenticated, isLoading, userId, isAdmin };
};