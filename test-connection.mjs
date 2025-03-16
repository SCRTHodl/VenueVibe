// Test Supabase connection with service role
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const tokenEconomySchema = process.env.VITE_TOKEN_ECONOMY_SCHEMA || 'token_economy';

console.log('Testing Supabase connection...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Token Economy Schema: ${tokenEconomySchema}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or Service Key');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    // Test regular connection
    console.log('\nTesting basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase.from('_test_connection').select('*').limit(1).maybeSingle();
    
    if (connectionError) {
      if (connectionError.code === 'PGRST116') {
        console.log('✅ Basic connection successful (table does not exist, but connection works)');
      } else {
        console.error('❌ Connection error:', connectionError);
      }
    } else {
      console.log('✅ Basic connection successful');
    }
    
    console.log('\n--------------------------');
    console.log('Connection test complete!');
    console.log('--------------------------');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();
