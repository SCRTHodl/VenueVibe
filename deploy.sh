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

# Ensure vercel.json exists
if [ ! -f "./vercel.json" ]; then
    echo "⚙️ Creating vercel.json configuration..."
    cat > ./vercel.json << EOL
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co; worker-src 'self' blob:;"
        }
      ]
    }
  ]
}
EOL
fi

# Set up environment variables on Vercel
echo "🔐 Setting up environment variables..."
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_TOKEN_ECONOMY_SCHEMA token_economy

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment preparation completed!"
