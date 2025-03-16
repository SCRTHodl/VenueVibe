// Script to check database schema in Supabase
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
const supabaseUrl = 'https://jvmfmgkpkkoqmhzrbzyz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bWZtZ2twa2tvcW1oenJienl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDk4MzAyNCwiZXhwIjoyMDU2NTU5MDI0fQ.PQg9D2lrPJdlCgQH20_r4QKOk35yU6N8WhpOb7IkEY4'

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  try {
    console.log('Checking database schema...')
    
    // Check if the stories table exists
    const { data: storiesData, error: storiesError } = await supabase
      .from('stories')
      .select('id')
      .limit(1)
    
    if (storiesError) {
      console.log('❌ stories table does not exist')
    } else {
      console.log('✅ stories table exists')
    }
    
    // Check if the token_economy schema exists through one of its tables
    const { data: tokenEconomyData, error: tokenEconomyError } = await supabase
      .from('token_economy.user_token_balances')
      .select('user_id')
      .limit(1)
    
    if (tokenEconomyError) {
      console.log('❌ token_economy schema does not exist or is not properly set up')
    } else {
      console.log('✅ token_economy schema exists')
    }
    
    console.log('\nDatabase setup instructions:')
    console.log('1. Go to https://supabase.com/dashboard/project/jvmfmgkpkkoqmhzrbzyz/sql')
    console.log('2. Click "New Query"')
    console.log('3. Copy the contents of combined_migrations.sql')
    console.log('4. Paste into the SQL editor and execute')
    
  } catch (error) {
    console.error('Error checking schema:', error)
  }
}

// Execute the check
checkSchema()
