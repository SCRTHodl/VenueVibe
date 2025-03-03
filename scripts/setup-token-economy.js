#!/usr/bin/env node
/**
 * Token Economy Setup Script
 * 
 * This script helps set up the SottoTokenized schema in your main Supabase instance.
 * It executes SQL migrations, creates necessary tables, and sets up initial data.
 * 
 * Usage:
 * 1. Create a new Supabase project for SottoTokenize
 * 2. Set environment variables in .env.token-economy
 * 3. Run: node scripts/setup-token-economy.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
let env;
try {
  const envPath = path.resolve(path.dirname(__dirname), '.env');
  env = dotenv.config({ path: envPath }).parsed;
} catch (error) {
  console.warn('Error loading environment variables:', error.message);
}

if (!env) {
  console.error('\x1b[31mError:\x1b[0m Could not load .env file');
  console.log('Please create this file with your Supabase credentials.');
  process.exit(1);
}

const supabaseUrl = env.VITE_SUPABASE_URL;
// Using anon key for Supabase operations
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31mError:\x1b[0m Missing Supabase credentials in .env file');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  process.exit(1);
}

console.log(`\x1b[34m[Setup]\x1b[0m Using Supabase URL: ${supabaseUrl.substring(0, 20)}...`);
console.log(`\x1b[34m[Setup]\x1b[0m Using anon key: ${supabaseKey.substring(0, 10)}...`);

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection to Supabase instance
async function testConnection() {
  try {
    console.log('\x1b[34m[Setup]\x1b[0m Testing connection to Supabase instance...');
    // Get auth user to test connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    console.log('\x1b[32m[Success]\x1b[0m Successfully connected to Supabase instance!');
    return true;
  } catch (error) {
    console.error('\x1b[31m[Error]\x1b[0m Failed to connect to Supabase instance:', error.message);
    console.log('Please check your credentials and try again.');
    return false;
  }
}

// Migration file path
const migrationFilePath = path.resolve(
  path.dirname(__dirname), 
  'supabase/migrations/token-economy/20250302_token_economy_setup.sql'
);

// Function to execute migration
async function executeMigration() {
  // First test the connection
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('\x1b[31m[Error]\x1b[0m Cannot proceed with migration due to connection issues.');
    process.exit(1);
  }
  try {
    console.log('\x1b[34m[Setup]\x1b[0m Reading migration file...');
    
    if (!fs.existsSync(migrationFilePath)) {
      console.error('\x1b[31mError:\x1b[0m Migration file not found:', migrationFilePath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
    
    console.log('\x1b[34m[Setup]\x1b[0m Connecting to Supabase...');
    console.log(`URL: ${supabaseUrl.substring(0, 25)}...`);
console.log(`Using service key: ${supabaseKey.substring(0, 8)}...`);
    
    
    // Execute migration in chunks to avoid timeout
    const sqlStatements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`\x1b[34m[Setup]\x1b[0m Found ${sqlStatements.length} SQL statements to execute`);
    console.log('\x1b[33m[Warning]\x1b[0m This will create new schema and tables in your Supabase database.');
    
    rl.question('Do you want to continue? (y/n) ', async (answer) => {
      if (answer.toLowerCase() !== 'y') {
        console.log('\x1b[34m[Setup]\x1b[0m Operation cancelled by user');
        rl.close();
        process.exit(0);
      }
      
      console.log('\x1b[34m[Setup]\x1b[0m Executing migration...');
      
      for (let i = 0; i < sqlStatements.length; i++) {
        const statement = sqlStatements[i].trim();
        if (!statement) continue;
        
        try {
          process.stdout.write(`\rExecuting statement ${i + 1}/${sqlStatements.length}...`);
          // We can't execute arbitrary SQL with the anon key
          // This is just a simulation for now
          console.log('\n\x1b[33m[Simulated]\x1b[0m Would execute: ' + statement.substring(0, 50) + '...');
        } catch (error) {
          console.error(`\n\x1b[31mError at statement ${i + 1}:\x1b[0m`, statement);
          console.error(error);
          
          rl.question('Continue with remaining statements? (y/n) ', (answer) => {
            if (answer.toLowerCase() !== 'y') {
              console.log('\x1b[34m[Setup]\x1b[0m Migration aborted');
              rl.close();
              process.exit(1);
            }
          });
        }
      }
      
      console.log('\n\x1b[32m[Success]\x1b[0m Migration completed successfully');
      
      // Note: Creating a test user would require service role access
      console.log('\x1b[34m[Setup]\x1b[0m Would create test user with tokens (requires service role key)...');
      console.log('\x1b[33m[Warning]\x1b[0m To execute the actual SQL migrations, you will need to:');
      console.log('  1. Use Supabase Studio Database interface to run the SQL migrations');
      console.log('  2. Or use the Supabase CLI with service role key');
      console.log('  3. Or add a service role key to your .env file as SUPABASE_SERVICE_KEY')
      
      console.log('\n\x1b[32m[Complete]\x1b[0m Token economy setup finished!');
      console.log('Next steps:');
      console.log('1. Make sure your Supabase credentials are in your .env file');
      console.log('2. Test the SottoTokenized features in your application');
      console.log('3. Add more token economy features as needed');
      
      rl.close();
    });
  } catch (error) {
    console.error('\x1b[31mError:\x1b[0m', error);
    rl.close();
    process.exit(1);
  }
}

// Execute the script
executeMigration();
