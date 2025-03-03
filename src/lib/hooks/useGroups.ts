import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Group } from '../../types';
import { TEST_GROUPS } from '../../constants';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>(TEST_GROUPS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setGroups(data as Group[]);
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError('Failed to load groups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const addGroup = async (group: Omit<Group, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert([group])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setGroups(prev => [...prev, data as Group]);
      }
    } catch (err) {
      console.error('Error adding group:', err);
      throw err;
    }
  };

  const updateGroup = async (id: string, updates: Partial<Group>) => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
      }
    } catch (err) {
      console.error('Error updating group:', err);
      throw err;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Error deleting group:', err);
      throw err;
    }
  };

  return {
    groups,
    isLoading,
    error,
    addGroup,
    updateGroup,
    deleteGroup
  };
};