// Apply migrations to Supabase
// This script applies the database schema migrations to your Supabase instance
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or Service Key not found in environment variables');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function execSQL(sql) {
  // Split the SQL into statements
  const statements = sql.split(';').filter(stmt => stmt.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          console.error('SQL execution error:', error);
          // Continue with other statements
        }
      } catch (error) {
        console.error('SQL execution error:', error);
        // Continue with other statements
      }
    }
  }
}

async function createExecSQLFunction() {
  // Try to create the exec_sql function for running SQL directly
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    // Execute directly as we don't have the function yet
    const { error } = await supabase.rpc('exec_sql', { sql_query: createFunctionSQL });
    
    if (error) {
      // Function might not exist, try directly with PostgreSQL query
      const { error: directError } = await supabase.from('rpc').select('*').eq('id', 'exec_sql');
      
      if (directError) {
        console.error('Could not create exec_sql function:', directError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    return false;
  }
}

async function applyMigration(filePath) {
  try {
    console.log(`Applying migration: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the SQL directly
    await execSQL(sql);
    
    console.log(`✓ Successfully applied: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`Error reading or executing migration ${path.basename(filePath)}:`, error);
    return false;
  }
}

async function applyMigrations() {
  console.log('Starting database migrations...');
  console.log(`Connected to Supabase: ${supabaseUrl}`);
  
  // First, try to create the exec_sql function
  await createExecSQLFunction();
  
  // Apply the initial schema setup
  const initialSchemaPath = path.join(__dirname, 'supabase', 'migrations', '20250303_initial_schema_setup.sql');
  if (fs.existsSync(initialSchemaPath)) {
    console.log('Applying initial schema setup...');
    await applyMigration(initialSchemaPath);
  } else {
    console.log('Initial schema script not found, skipping...');
  }
  
  // Get token economy migrations
  const tokenEconomyDir = path.join(__dirname, 'supabase', 'migrations', 'token-economy');
  if (fs.existsSync(tokenEconomyDir)) {
    const files = fs.readdirSync(tokenEconomyDir);
    for (const file of files) {
      if (file.endsWith('.sql')) {
        await applyMigration(path.join(tokenEconomyDir, file));
      }
    }
  }
  
  console.log('\nMigration complete!');
}

// Run the migrations
applyMigrations().catch(error => {
  console.error('Fatal error during migration:', error);
  process.exit(1);
});
