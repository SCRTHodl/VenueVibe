// Script to apply database migrations to Supabase
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
const supabaseUrl = 'https://jvmfmgkpkkoqmhzrbzyz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bWZtZ2twa2tvcW1oenJienl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDk4MzAyNCwiZXhwIjoyMDU2NTU5MDI0fQ.PQg9D2lrPJdlCgQH20_r4QKOk35yU6N8WhpOb7IkEY4'

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  try {
    console.log('Starting migration process...')
    
    // Read the combined migrations file
    const migrationSql = fs.readFileSync(
      path.join(__dirname, 'combined_migrations.sql'),
      'utf8'
    )
    
    // Split the SQL into individual statements
    const statements = migrationSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      try {
        const statement = statements[i]
        console.log(`Executing statement ${i + 1}/${statements.length}`)
        
        // Supabase REST API doesn't directly support arbitrary SQL
        // We need to use a PostgreSQL function or direct connection
        // For this example, we'll use a single-use SQL function
        
        const functionName = `apply_migration_${Date.now()}_${i}`
        
        // Create a function that executes our SQL
        const { error: createFnError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE OR REPLACE FUNCTION ${functionName}() RETURNS void AS $$
            BEGIN
              ${statement};
            END;
            $$ LANGUAGE plpgsql;
          `
        })
        
        if (createFnError) {
          console.error(`Error creating function for statement ${i + 1}:`, createFnError)
          continue
        }
        
        // Execute the function
        const { error: execError } = await supabase.rpc(functionName)
        
        if (execError) {
          console.error(`Error executing statement ${i + 1}:`, execError)
        }
        
        // Drop the function
        await supabase.rpc('exec_sql', {
          sql: `DROP FUNCTION IF EXISTS ${functionName}()`
        })
        
      } catch (stmtError) {
        console.error(`Error processing statement ${i + 1}:`, stmtError)
      }
    }
    
    console.log('Migration completed')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Execute the migrations
applyMigrations()
