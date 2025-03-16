/**
 * Development server launcher with proper environment variable loading
 * This script ensures environment variables are correctly loaded from .env
 */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get the current file's directory path (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found! Please create one based on .env.example');
  process.exit(1);
}

console.log('📚 Loading environment variables from .env file...');
const envVars = dotenv.config({ path: envPath }).parsed;

// Verify required environment variables
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'VITE_TOKEN_ECONOMY_SCHEMA'
];

const missingVars = requiredVars.filter(name => !envVars[name]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please add them to your .env file and try again.');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log('🚀 Starting development server with proper environment...');

// Start the Vite dev server with environment variables
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env, ...envVars }
});

devProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Development server exited with code ${code}`);
  }
});
