#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment preparation..."

# Ensure Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "🔧 Installing Vercel CLI..."
    npm install -g vercel
fi

# Ensure all dependencies are installed
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🏗️ Building project..."
npm run build

# Ensure _headers file exists
if [ ! -f "./public/_headers" ]; then
    echo "🔒 Creating _headers file for Content Security Policy..."
    echo "/*" > ./public/_headers
    echo "  Content-Security-Policy: script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co; worker-src 'self' blob:;" >> ./public/_headers
fi

# We've already created and updated vercel.json and netlify.toml
echo "⚙️ Using existing vercel.json configuration with updated CSP settings..."

# Set up environment variables on Vercel
echo "🔐 Setting up environment variables..."
echo "Please enter your Supabase URL:"
vercel env add VITE_SUPABASE_URL

echo "Please enter your Supabase Anonymous Key:"
vercel env add VITE_SUPABASE_ANON_KEY

echo "Please enter your Supabase Service Role Key (required for token economy):"
vercel env add VITE_SUPABASE_SERVICE_ROLE_KEY

echo "Setting token economy schema to 'token_economy':"
vercel env add VITE_TOKEN_ECONOMY_SCHEMA -y token_economy

echo "Please enter your Stripe Public Key:"
vercel env add VITE_STRIPE_PUBLIC_KEY

echo "Please enter your Mapbox Token:"
vercel env add VITE_MAPBOX_TOKEN

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment preparation completed!"
