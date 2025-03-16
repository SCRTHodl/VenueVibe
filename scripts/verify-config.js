/**
 * Config verification script
 * This script checks that all required environment variables are set and
 * validates the Supabase connection including admin client access to token_economy schema
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

console.log(`Loading environment variables from: ${envPath}`);
dotenv.config({ path: envPath });

// Check environment variables
const checkEnvironmentVariables = () => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_SERVICE_ROLE_KEY',
    'VITE_TOKEN_ECONOMY_SCHEMA',
    'VITE_STRIPE_PUBLIC_KEY',
    'VITE_MAPBOX_TOKEN'
  ];

  const results = {};
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    results[varName] = {
      exists: !!value,
      value: value ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : null
    };
  }
  
  return results;
};

// Test Supabase connection
const testSupabaseConnection = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: 'Missing Supabase URL or Anon Key' };
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    return {
      success: !error,
      error: error?.message,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Test token economy schema access with admin client
const testTokenEconomyAccess = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const tokenEconomySchema = process.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';
  
  if (!supabaseUrl || !serviceRoleKey) {
    return { success: false, error: 'Missing Supabase URL or Service Role Key' };
  }
  
  try {
    console.log('Creating admin client with service role key...');
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    console.log(`Testing access to ${tokenEconomySchema}.tokens table...`);
    const { data, error } = await adminClient
      .schema(tokenEconomySchema)
      .from('tokens')
      .select('count')
      .limit(1);
    
    return {
      success: !error,
      error: error?.message,
      data,
      usingServiceRole: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Run all tests
const runTests = async () => {
  try {
    console.log('Checking environment variables...');
    const envResults = checkEnvironmentVariables();
    console.log(JSON.stringify(envResults, null, 2));
    
    console.log('\nTesting Supabase connection...');
    const connectionResults = await testSupabaseConnection();
    console.log(JSON.stringify(connectionResults, null, 2));
    
    console.log('\nTesting token economy schema access...');
    const tokenEconomyResults = await testTokenEconomyAccess();
    console.log(JSON.stringify(tokenEconomyResults, null, 2));
    
    // Summary
    console.log('\n--- Configuration Summary ---');
    const missingVars = Object.entries(envResults)
      .filter(([, result]) => !result.exists)
      .map(([name]) => name);
    
    if (missingVars.length > 0) {
      console.log('⚠️ Missing environment variables:', missingVars.join(', '));
    } else {
      console.log('✅ All required environment variables are set');
    }
    
    if (connectionResults.success) {
      console.log('✅ Supabase connection successful');
    } else {
      console.log('❌ Supabase connection failed:', connectionResults.error);
    }
    
    if (tokenEconomyResults.success) {
      console.log(`✅ Token economy schema (${process.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy'}) access successful`);
    } else {
      console.log('❌ Token economy schema access failed:', tokenEconomyResults.error);
    }
  } catch (error) {
    console.error('Error running tests:', error);
  }
};

runTests();
