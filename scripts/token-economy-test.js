// Token Economy Test Script
// Tests token economy schema access and operations
// Usage: node token-economy-test.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const tokenEconomySchema = process.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service role key in environment variables');
  process.exit(1);
}

// Create clients
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Test functions
async function testAnonClientAccess() {
  console.log('\n🔍 Testing anonymous client access to token_economy schema...');
  
  try {
    // Try to access token_economy schema with anon client - should fail
    const { data, error } = await anonClient
      .from(`${tokenEconomySchema}.token_transactions`)
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('✅ Expected error with anon client using string concatenation:', error.message);
    } else {
      console.error('❌ Unexpected success with anon client using string concatenation');
    }
    
    // Try with schema method - should also fail
    const { data: schemaData, error: schemaError } = await anonClient
      .schema(tokenEconomySchema)
      .from('token_transactions')
      .select('count')
      .limit(1);
    
    if (schemaError) {
      console.log('✅ Expected error with anon client using schema method:', schemaError.message);
    } else {
      console.error('❌ Unexpected success with anon client using schema method');
    }
  } catch (error) {
    console.log('✅ Expected error with anon client:', error.message);
  }
}

async function testAdminClientAccess() {
  console.log('\n🔍 Testing admin client access to token_economy schema...');
  
  try {
    // Try to access token_economy schema with admin client using string concatenation
    const { data: concatData, error: concatError } = await adminClient
      .from(`${tokenEconomySchema}.token_transactions`)
      .select('count')
      .limit(1);
    
    if (concatError) {
      console.log('❌ Error with admin client using string concatenation:', concatError.message);
    } else {
      console.log('✅ Admin client with string concatenation works, but is not recommended');
    }
    
    // Try with schema method - this is the recommended approach
    const { data: schemaData, error: schemaError } = await adminClient
      .schema(tokenEconomySchema)
      .from('token_transactions')
      .select('count')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Error with admin client using schema method:', schemaError.message);
    } else {
      console.log('✅ Admin client with schema method works correctly!');
    }
  } catch (error) {
    console.error('❌ Unexpected error with admin client:', error.message);
  }
}

async function testRpcFunctions() {
  console.log('\n🔍 Testing RPC functions in token_economy schema...');
  
  try {
    // Test RPC function with string prefix (old way)
    const { data: prefixData, error: prefixError } = await adminClient
      .rpc(`${tokenEconomySchema}.get_economy_stats`);
    
    if (prefixError) {
      console.log('❌ Error with RPC using string prefix:', prefixError.message);
    } else {
      console.log('✅ RPC with string prefix works, but is not recommended');
    }
    
    // Test RPC function with schema method (new way)
    const { data: schemaData, error: schemaError } = await adminClient
      .schema(tokenEconomySchema)
      .rpc('get_economy_stats');
    
    if (schemaError) {
      console.error('❌ Error with RPC using schema method:', schemaError.message);
    } else {
      console.log('✅ RPC with schema method works correctly!');
    }
  } catch (error) {
    console.error('❌ Unexpected error testing RPC functions:', error.message);
  }
}

// Main function
async function runTests() {
  console.log('🔄 Running Token Economy Tests');
  console.log('==============================');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  console.log(`Token Economy Schema: ${tokenEconomySchema}`);
  
  await testAnonClientAccess();
  await testAdminClientAccess();
  await testRpcFunctions();
  
  console.log('\n✨ Token Economy Tests Complete!');
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
