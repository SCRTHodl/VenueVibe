import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Create a secure Supabase client with the service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Create Supabase admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Get JWT from request authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the request body
    const { operation, table, data, filters } = await req.json()
    
    // Access token_economy schema with full admin privileges
    let result
    const tokenEconomySchema = supabase.schema('token_economy')
    
    switch (operation) {
      case 'select':
        result = await tokenEconomySchema.from(table).select('*')
        if (filters) {
          // Apply any filters passed from client
          Object.entries(filters).forEach(([key, value]) => {
            result = result.eq(key, value)
          })
        }
        break
        
      case 'insert':
        result = await tokenEconomySchema.from(table).insert({
          ...data,
          user_id: user.id // Add user_id to ensure data ownership
        })
        break
        
      case 'update':
        if (!filters || !filters.id) {
          return new Response(
            JSON.stringify({ error: 'ID is required for update operations' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // First check if user owns this record
        const { data: checkData } = await tokenEconomySchema
          .from(table)
          .select('user_id')
          .eq('id', filters.id)
          .single()
          
        if (!checkData || checkData.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized to update this record' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        result = await tokenEconomySchema
          .from(table)
          .update(data)
          .eq('id', filters.id)
        break
        
      case 'delete':
        if (!filters || !filters.id) {
          return new Response(
            JSON.stringify({ error: 'ID is required for delete operations' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // First check if user owns this record
        const { data: checkDeleteData } = await tokenEconomySchema
          .from(table)
          .select('user_id')
          .eq('id', filters.id)
          .single()
          
        if (!checkDeleteData || checkDeleteData.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized to delete this record' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        result = await tokenEconomySchema
          .from(table)
          .delete()
          .eq('id', filters.id)
        break
        
      case 'get_wallet':
        // Special operation to get user's wallet balance
        result = await tokenEconomySchema
          .from('wallets')
          .select('*')
          .eq('user_id', user.id)
          .single()
        break
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
    
    return new Response(
      JSON.stringify({ data: result.data, error: result.error }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
