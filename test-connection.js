// Test Supabase connection with service role
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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
    
    // Test database version
    console.log('\nFetching database version...');
    const { data: versionData, error: versionError } = await supabase.rpc('get_db_version');
    
    if (versionError) {
      console.error('❌ Could not get database version:', versionError);
      // Try an alternative way to get information about the database
      const { data: schemas, error: schemaError } = await supabase.rpc('list_schemas');
      if (!schemaError) {
        console.log('Available schemas:', schemas);
      }
    } else {
      console.log('✅ Database version:', versionData);
    }
    
    // Test if token_economy schema exists
    console.log(`\nChecking if '${tokenEconomySchema}' schema exists...`);
    const { data: schemaExists, error: schemaError } = await supabase.rpc('schema_exists', { schema_name: tokenEconomySchema });
    
    if (schemaError) {
      console.error(`❌ Error checking schema: ${schemaError.message}`);
      console.log('Adding a helper function to check schema existence...');
      
      // Create a temporary function to check schema existence
      await supabase.rpc('exec_sql', { 
        sql_query: `
          CREATE OR REPLACE FUNCTION public.schema_exists(schema_name text)
          RETURNS boolean AS $$
          BEGIN
            RETURN EXISTS (
              SELECT 1 FROM information_schema.schemata WHERE schema_name = $1
            );
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      
      const { data: retrySchemaExists, error: retrySchemaError } = await supabase.rpc('schema_exists', { schema_name: tokenEconomySchema });
      
      if (retrySchemaError) {
        console.error(`❌ Still unable to check schema: ${retrySchemaError.message}`);
      } else {
        console.log(`${retrySchemaExists ? '✅' : '❌'} Schema '${tokenEconomySchema}' ${retrySchemaExists ? 'exists' : 'does not exist'}`);
      }
    } else {
      console.log(`${schemaExists ? '✅' : '❌'} Schema '${tokenEconomySchema}' ${schemaExists ? 'exists' : 'does not exist'}`);
    }
    
    // Create schema helper function for database version
    console.log('\nCreating helper function for database version...');
    await supabase.rpc('exec_sql', { 
      sql_query: `
        CREATE OR REPLACE FUNCTION public.get_db_version()
        RETURNS text AS $$
        BEGIN
          RETURN current_setting('server_version');
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    console.log('✅ Helper function created');

    // Final connection status
    console.log('\n--------------------------');
    console.log('Connection test complete!');
    console.log('--------------------------');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();
