import { supabase } from './supabase';

/**
 * Admin service for performing operations that require elevated permissions
 * This service makes calls to serverless functions instead of using the service role key directly
 */
export const adminService = {
  /**
   * Checks if a user has admin privileges
   * @param userId The user ID to check
   * @returns Promise resolving to boolean indicating admin status
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return false;
      }

      const response = await fetch('/.netlify/functions/admin-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          action: 'isUserAdmin',
          payload: { userId }
        })
      });

      if (!response.ok) {
        console.error('Admin check failed:', await response.text());
        return false;
      }

      const result = await response.json();
      return result.isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  /**
   * Updates a user's status (active, suspended, banned)
   * @param userId The user ID to update
   * @param status The new status
   * @returns Promise resolving to the updated user or null on error
   */
  async updateUserStatus(userId: string, status: string): Promise<any> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No authenticated session');
      }

      const response = await fetch('/.netlify/functions/admin-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          action: 'updateUserStatus',
          payload: { userId, status }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return result.user;
    } catch (error) {
      console.error('Error updating user status:', error);
      return null;
    }
  },

  /**
   * Updates a setting in the database
   * @param key The setting key
   * @param value The setting value
   * @returns Promise resolving to the updated setting or null on error
   */
  async updateSetting(key: string, value: any): Promise<any> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No authenticated session');
      }

      const response = await fetch('/.netlify/functions/admin-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          action: 'updateSetting',
          payload: { key, value }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return result.setting;
    } catch (error) {
      console.error('Error updating setting:', error);
      return null;
    }
  },

  /**
   * Records a moderation action
   * @param contentId ID of the content being moderated
   * @param contentType Type of content (e.g., 'post', 'comment', 'story')
   * @param action The moderation action (e.g., 'approve', 'reject', 'flag')
   * @param notes Optional notes from the moderator
   * @param moderatorId The ID of the moderator making the action
   * @returns Promise resolving to the created moderation action or null on error
   */
  async recordModerationAction(
    contentId: string,
    contentType: string,
    action: string,
    notes: string,
    moderatorId: string
  ): Promise<any> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No authenticated session');
      }

      const response = await fetch('/.netlify/functions/admin-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          action: 'recordModerationAction',
          payload: { contentId, contentType, action, notes, moderatorId }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return result.moderationAction;
    } catch (error) {
      console.error('Error recording moderation action:', error);
      return null;
    }
  },

  /**
   * Gets token economy statistics for the admin dashboard
   * @returns Promise resolving to token economy stats or null on error
   */
  async getTokenEconomyStats(): Promise<any> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No authenticated session');
      }

      const response = await fetch('/.netlify/functions/admin-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          action: 'getTokenEconomyStats',
          payload: {}
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting token economy stats:', error);
      return null;
    }
  },

  /**
   * Gets content moderation settings
   * @returns Promise resolving to moderation settings or null on error
   */
  async getModerationSettings(): Promise<any> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No authenticated session');
      }

      const response = await fetch('/.netlify/functions/admin-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          action: 'getModerationSettings',
          payload: {}
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return result.settings;
    } catch (error) {
      console.error('Error getting moderation settings:', error);
      return null;
    }
  }
};
