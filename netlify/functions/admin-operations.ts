import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Create a secure admin client with service role key
// This only runs on the server, so the service role key is never exposed to the client
const getAdminClient = () => {
  // Netlify environment variables don't have the VITE_ prefix when used in functions
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_SERVICE_KEY || 
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
    process.env.VITE_SUPABASE_SERVICE_KEY || 
    '';
  
  if (!supabaseServiceKey || !supabaseUrl) {
    throw new Error('Missing Supabase credentials in environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

// Handler for the Netlify serverless function
export const handler: Handler = async (event, context) => {
  // Only allow POST requests for security
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get the JWT token from Authorization header to authenticate the user
  const authHeader = event.headers.authorization || '';
  const token = authHeader.split(' ')[1] || '';
  
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized - No token provided' })
    };
  }
  
  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    const { action, payload } = body;
    
    if (!action) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameter: action' })
      };
    }
    
    // Get the admin client
    const adminClient = getAdminClient();
    
    // Handle different admin operations based on the action parameter
    switch (action) {
      case 'isUserAdmin': {
        const { userId } = payload || {};
        if (!userId) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required parameter: userId' })
          };
        }
        
        // Check if user is admin from users table
        const { data, error } = await adminClient
          .from('users')
          .select('is_admin')
          .eq('id', userId)
          .single();
        
        if (error) {
          return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
          };
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ isAdmin: data?.is_admin || false })
        };
      }
      
      case 'getTokenEconomyStats': {
        // Get token economy stats for admin dashboard
        const tokenEconomySchema = process.env.TOKEN_ECONOMY_SCHEMA || process.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';
        
        // Query for total users with tokens
        const { data: userCount, error: userError } = await adminClient
          .from('users_tokens')
          .select('user_id', { count: 'exact' });
          
        // Query for total transactions
        const { data: txData, error: txError } = await adminClient
          .from('token_transactions')
          .select('amount', { count: 'exact' });
          
        // Calculate total tokens in circulation
        const totalTokens = txData?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
        
        if (userError || txError) {
          return {
            statusCode: 500,
            body: JSON.stringify({ 
              error: userError?.message || txError?.message 
            })
          };
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            userCount: userCount?.length || 0,
            transactionCount: txData?.length || 0,
            totalTokens
          })
        };
      }
      
      case 'getModerationSettings': {
        // Get content moderation settings
        const { data, error } = await adminClient
          .from('moderation_settings')
          .select('*')
          .single();
        
        if (error) {
          // If not found, return default settings
          if (error.code === 'PGRST116') {
            return {
              statusCode: 200,
              body: JSON.stringify({
                settings: {
                  imageModeration: true,
                  textModeration: true,
                  moderationLevel: 'medium',
                  autoDeleteFlagged: false,
                  notifyAdminsOnFlag: true
                }
              })
            };
          }
          
          return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
          };
        }
        
        // Map database column names to camelCase for frontend
        return {
          statusCode: 200,
          body: JSON.stringify({
            settings: {
              imageModeration: data.image_moderation,
              textModeration: data.text_moderation,
              moderationLevel: data.moderation_level,
              autoDeleteFlagged: data.auto_delete_flagged,
              notifyAdminsOnFlag: data.notify_admins_on_flag
            }
          })
        };
      }
      
      case 'updateUserStatus': {
        const { userId, status } = payload || {};
        if (!userId || !status) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'Missing required parameters: userId and status' 
            })
          };
        }
        
        // Update user status
        const { data, error } = await adminClient
          .from('users')
          .update({ status })
          .eq('id', userId)
          .select()
          .single();
          
        if (error) {
          return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
          };
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ user: data })
        };
      }
      
      case 'updateSetting': {
        const { key, value } = payload || {};
        if (!key) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required parameter: key' })
          };
        }
        
        // Update setting
        const { data, error } = await adminClient
          .from('settings')
          .update({ value })
          .eq('key', key)
          .select()
          .single();
          
        if (error) {
          return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
          };
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ setting: data })
        };
      }
      
      case 'recordModerationAction': {
        const { contentId, contentType, action, notes, moderatorId } = payload || {};
        if (!contentId || !contentType || !action || !moderatorId) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'Missing required parameters for moderation action' 
            })
          };
        }
        
        // Record moderation action
        const { data, error } = await adminClient
          .from('moderation_actions')
          .insert({
            content_id: contentId,
            content_type: contentType,
            action,
            notes,
            moderator_id: moderatorId
          })
          .select()
          .single();
          
        if (error) {
          return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
          };
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ moderationAction: data })
        };
      }
      
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Unknown action: ${action}` })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Server error: ${error.message}` })
    };
  }
};
