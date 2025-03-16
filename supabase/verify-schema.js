// Schema verification script for Supabase
// Usage: node verify-schema.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables to verify
const requiredTables = [
  { schema: 'public', name: 'users' },
  { schema: 'public', name: 'stories' },
  { schema: 'token_economy', name: 'user_token_balances' },
  { schema: 'token_economy', name: 'token_transactions' }
];

async function verifyTable(schema, tableName) {
  try {
    // Try to select from the table - this will error if it doesn't exist
    // Use the schema method for non-public schemas
    let query;
    if (schema === 'public') {
      query = supabase.from(tableName);
    } else {
      query = supabase.schema(schema).from(tableName);
    }
    
    const { data, error } = await query
      .select('count')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error(`❌ Table ${schema}.${tableName} check failed:`, error.message);
      return false;
    }
    
    console.log(`✅ Table ${schema}.${tableName} exists`);
    return true;
  } catch (error) {
    console.error(`❌ Table ${schema}.${tableName} check failed:`, error.message);
    return false;
  }
}

async function verifyFunction(functionName) {
  try {
    // Call the function to verify it exists
    const { data, error } = await supabase.rpc(functionName);
    
    if (error) {
      console.error(`❌ Function ${functionName} check failed:`, error.message);
      return false;
    }
    
    console.log(`✅ Function ${functionName} exists`);
    return true;
  } catch (error) {
    console.error(`❌ Function ${functionName} check failed:`, error.message);
    return false;
  }
}

async function verifySchema() {
  console.log('Verifying Supabase schema...');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  let missingItems = 0;
  
  // Verify tables
  for (const table of requiredTables) {
    const exists = await verifyTable(table.schema, table.name);
    if (!exists) missingItems++;
  }
  
  // Verify functions
  const functionExists = await verifyFunction('get_subscriber_count');
  if (!functionExists) missingItems++;
  
  // Summary
  console.log('\nSchema verification complete!');
  if (missingItems === 0) {
    console.log('✅ All required tables and functions exist!');
  } else {
    console.log(`❌ ${missingItems} items are missing from the schema. Please run the migration scripts.`);
  }
}

verifySchema().catch(error => {
  console.error('Schema verification failed:', error);
  process.exit(1);
});
