#!/usr/bin/env node
/**
 * Create SottoTokenize Supabase Project
 * 
 * This utility script guides users through the process of creating a new
 * Supabase project for SottoTokenize and configuring the environment.
 * 
 * Usage:
 * 1. Run: node scripts/create-sottotokenize-project.js
 * 2. Follow the interactive prompts
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Setup readline interface for interactive prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function to ask questions
function question(query) {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

// Main function
async function main() {
  console.log(`\n${colors.magenta}===== SottoTokenize Supabase Project Setup =====\n${colors.reset}`);
  console.log(`${colors.cyan}This script will guide you through setting up a new Supabase project for SottoTokenize.\n${colors.reset}`);
  
  console.log(`${colors.blue}STEP 1: Create a new Supabase project${colors.reset}`);
  console.log(`1. Go to https://supabase.com/dashboard/projects`);
  console.log(`2. Click "New Project"`);
  console.log(`3. Name your project "SottoTokenize" or similar`);
  console.log(`4. Choose a secure password\n`);
  
  await question(`Press Enter when you've created your Supabase project...`);
  
  console.log(`\n${colors.blue}STEP 2: Get your Supabase credentials${colors.reset}`);
  console.log(`1. In your Supabase dashboard, go to Project Settings > API`);
  console.log(`2. Copy your Project URL, anon key, and service_role key\n`);
  
  const supabaseUrl = await question(`${colors.yellow}Enter your Supabase Project URL:${colors.reset} `);
  const supabaseAnonKey = await question(`${colors.yellow}Enter your anon key:${colors.reset} `);
  const supabaseServiceKey = await question(`${colors.yellow}Enter your service_role key:${colors.reset} `);
  
  // Validate inputs
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.log(`\n${colors.red}Error: All fields are required.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`\n${colors.blue}STEP 3: Updating .env file${colors.reset}`);
  
  // Path to .env file
  const envFilePath = path.resolve(process.cwd(), '.env');
  
  try {
    // Read the existing file
    let envContent = '';
    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, 'utf8');
    }
    
    // Update the content with the new values
    envContent = envContent
      .replace(/VITE_TOKEN_ECONOMY_SUPABASE_URL=.*/, `VITE_TOKEN_ECONOMY_SUPABASE_URL=${supabaseUrl}`)
      .replace(/VITE_TOKEN_ECONOMY_SUPABASE_ANON_KEY=.*/, `VITE_TOKEN_ECONOMY_SUPABASE_ANON_KEY=${supabaseAnonKey}`)
      .replace(/VITE_TOKEN_ECONOMY_SERVICE_KEY=.*/, `VITE_TOKEN_ECONOMY_SERVICE_KEY=${supabaseServiceKey}`);
    
    // If the replacements didn't work (no matches), append the variables
    if (!envContent.includes('VITE_TOKEN_ECONOMY_SUPABASE_URL=')) {
      envContent += `\n# SottoTokenize Supabase Configuration\nVITE_TOKEN_ECONOMY_SUPABASE_URL=${supabaseUrl}\n`;
    }
    if (!envContent.includes('VITE_TOKEN_ECONOMY_SUPABASE_ANON_KEY=')) {
      envContent += `VITE_TOKEN_ECONOMY_SUPABASE_ANON_KEY=${supabaseAnonKey}\n`;
    }
    if (!envContent.includes('VITE_TOKEN_ECONOMY_SERVICE_KEY=')) {
      envContent += `VITE_TOKEN_ECONOMY_SERVICE_KEY=${supabaseServiceKey}\n`;
    }
    
    // Write back to the file
    fs.writeFileSync(envFilePath, envContent);
    console.log(`${colors.green}Successfully updated ${envFilePath}${colors.reset}`);
    
    // Check if .env.token-economy exists and warn about it
    const legacyEnvPath = path.resolve(process.cwd(), '.env.token-economy');
    if (fs.existsSync(legacyEnvPath)) {
      console.log(`${colors.yellow}WARNING: .env.token-economy file exists but is deprecated.${colors.reset}`);
      console.log(`${colors.yellow}We now store all credentials in the main .env file for security.${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Error updating .env file:${colors.reset}`, error.message);
    process.exit(1);
  }
  
  console.log(`\n${colors.blue}STEP 4: Running database migration setup${colors.reset}`);
  const shouldRunMigration = await question(`Would you like to run the migration script now? (y/n): `);
  
  if (shouldRunMigration.toLowerCase() === 'y') {
    try {
      console.log(`\n${colors.cyan}Running migration script...${colors.reset}`);
      execSync('node scripts/setup-token-economy.js', { stdio: 'inherit' });
    } catch (error) {
      console.error(`${colors.red}Error running migration script.${colors.reset}`);
      console.log(`You can run it manually later with: node scripts/setup-token-economy.js`);
    }
  } else {
    console.log(`\n${colors.yellow}Skipping migration.${colors.reset}`);
    console.log(`You can run it later with: node scripts/setup-token-economy.js`);
  }
  
  console.log(`\n${colors.green}=====================================${colors.reset}`);
  console.log(`${colors.green}SottoTokenize Setup Complete!${colors.reset}`);
  console.log(`${colors.green}=====================================${colors.reset}`);
  console.log(`\nNext steps:`);
  console.log(`1. Update your main .env file with the same SottoTokenize credentials`);
  console.log(`2. Start your application and test the token economy features\n`);
  
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}An unexpected error occurred:${colors.reset}`, error);
  process.exit(1);
});
