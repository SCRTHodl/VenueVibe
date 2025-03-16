import { supabase } from '../lib/supabase';

// Base URL for the token economy edge function
// In production, this will be your Supabase project's edge function URL
// In development, it will be your local Supabase instance
const getTokenEconomyUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
  
  // Check if we're in development mode using localhost
  const isDev = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');
  
  // Return the appropriate URL based on environment
  return isDev 
    ? `${supabaseUrl}/functions/v1/token-economy`
    : `${supabaseUrl.replace('.supabase.co', '.functions.supabase.co')}/token-economy`;
};

/**
 * Performs operations on the token_economy schema through a secure edge function
 * This avoids exposing the service role key in client-side code
 */
export const tokenEconomyClient = {
  /**
   * Get the current user's wallet information
   * @returns Wallet data or error
   */
  async getWallet() {
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { data: null, error: new Error('No active session') };
    }
    
    // Get the access token
    const accessToken = sessionData.session.access_token;
    
    try {
      const response = await fetch(getTokenEconomyUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          operation: 'get_wallet',
        }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting wallet:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Fetch data from a token_economy table
   * @param table The table name in the token_economy schema
   * @param filters Optional filters to apply (key-value pairs)
   * @returns Selected data or error
   */
  async select(table: string, filters?: Record<string, any>) {
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { data: null, error: new Error('No active session') };
    }
    
    // Get the access token
    const accessToken = sessionData.session.access_token;
    
    try {
      const response = await fetch(getTokenEconomyUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          operation: 'select',
          table,
          filters,
        }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error selecting from ${table}:`, error);
      return { data: null, error };
    }
  },
  
  /**
   * Insert data into a token_economy table
   * @param table The table name in the token_economy schema
   * @param data The data to insert
   * @returns Inserted data or error
   */
  async insert(table: string, data: Record<string, any>) {
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { data: null, error: new Error('No active session') };
    }
    
    // Get the access token
    const accessToken = sessionData.session.access_token;
    
    try {
      const response = await fetch(getTokenEconomyUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          operation: 'insert',
          table,
          data,
        }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      return { data: null, error };
    }
  },
  
  /**
   * Update data in a token_economy table
   * @param table The table name in the token_economy schema
   * @param id The ID of the record to update
   * @param data The data to update
   * @returns Updated data or error
   */
  async update(table: string, id: string, data: Record<string, any>) {
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { data: null, error: new Error('No active session') };
    }
    
    // Get the access token
    const accessToken = sessionData.session.access_token;
    
    try {
      const response = await fetch(getTokenEconomyUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          operation: 'update',
          table,
          filters: { id },
          data,
        }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      return { data: null, error };
    }
  },
  
  /**
   * Delete data from a token_economy table
   * @param table The table name in the token_economy schema
   * @param id The ID of the record to delete
   * @returns Deletion status or error
   */
  async delete(table: string, id: string) {
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { data: null, error: new Error('No active session') };
    }
    
    // Get the access token
    const accessToken = sessionData.session.access_token;
    
    try {
      const response = await fetch(getTokenEconomyUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          operation: 'delete',
          table,
          filters: { id },
        }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      return { data: null, error };
    }
  },
};
