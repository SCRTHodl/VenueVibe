// Test script to verify token economy functionality with the public schema
// Run with: node test_token_economy.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Create a standard client
const supabase = createClient(supabaseUrl, supabaseKey);

// Create an admin client with service role key
const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function testTokenEconomyTables() {
  console.log('Testing token economy tables in public schema...');
  
  try {
    // Test 1: Check if te_promotion_settings table exists and is accessible
    const { data: promotionSettings, error: settingsError } = await supabase
      .from('te_promotion_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.error('Error accessing te_promotion_settings:', settingsError);
    } else {
      console.log('✅ Successfully accessed te_promotion_settings table');
      console.log('Data:', promotionSettings);
    }
    
    // Test 2: Check if te_user_token_balances table exists and is accessible
    const { data: tokenBalances, error: balancesError } = await supabase
      .from('te_user_token_balances')
      .select('*')
      .limit(5);
    
    if (balancesError) {
      console.error('Error accessing te_user_token_balances:', balancesError);
    } else {
      console.log('✅ Successfully accessed te_user_token_balances table');
      console.log('Data:', tokenBalances);
    }
    
    // Test 3: Check if the RPC function works
    // Note: This will only work if you're authenticated as a user
    // and have the proper permissions
    const { data: rpcData, error: rpcError } = await supabase.rpc('grant_free_refresh_tokens', {
      p_user_id: 'test-user-id',
      p_token_count: 10
    });
    
    if (rpcError) {
      console.log('RPC function error (expected if not authenticated):', rpcError.message);
    } else {
      console.log('✅ Successfully called grant_free_refresh_tokens function');
      console.log('Result:', rpcData);
    }
    
  } catch (error) {
    console.error('Unexpected error during testing:', error);
  }
}

// Run tests
testTokenEconomyTables();
