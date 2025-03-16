// Apply migrations to Supabase
// This script applies the database schema migrations to your Supabase instance
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function applyMigration(filePath) {
  try {
    console.log(`Applying migration: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the SQL script
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`Error applying migration ${path.basename(filePath)}:`, error);
      return false;
    }
    
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
  
  // Get all migration files
  const migrationDir = path.join(__dirname, 'supabase', 'migrations');
  const migrationFiles = [];
  
  // Read main migrations directory
  try {
    const files = fs.readdirSync(migrationDir);
    files.forEach(file => {
      if (file.endsWith('.sql')) {
        migrationFiles.push(path.join(migrationDir, file));
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not read migrations directory: ${error.message}`);
  }
  
  // Read token-economy subdirectory if it exists
  const tokenEconomyDir = path.join(migrationDir, 'token-economy');
  if (fs.existsSync(tokenEconomyDir)) {
    try {
      const files = fs.readdirSync(tokenEconomyDir);
      files.forEach(file => {
        if (file.endsWith('.sql')) {
          migrationFiles.push(path.join(tokenEconomyDir, file));
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not read token-economy directory: ${error.message}`);
    }
  }
  
  if (migrationFiles.length === 0) {
    console.warn('No migration files found');
    return;
  }
  
  console.log(`Found ${migrationFiles.length} migration files`);
  
  // Apply each migration
  let successCount = 0;
  for (const file of migrationFiles) {
    const success = await applyMigration(file);
    if (success) successCount++;
  }
  
  console.log(`\nMigration complete: ${successCount}/${migrationFiles.length} files applied successfully`);
}

// Run the migrations
applyMigrations().catch(error => {
  console.error('Fatal error during migration:', error);
  process.exit(1);
});
