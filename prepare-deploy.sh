#!/bin/bash

# Prepare for deployment
echo "🚀 Preparing for deployment..."

# Check for vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

# Create required Vercel configuration files if they don't exist
if [ ! -f "vercel.json" ]; then
  echo "Creating vercel.json..."
  cat > vercel.json << EOF
{
  "version": 2,
  "cleanUrls": true,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
EOF
fi

# Copy environment variables from .env to .env.production
if [ -f ".env" ]; then
  echo "Creating .env.production from .env..."
  cp .env .env.production
fi

# Build the application
echo "Building the application..."
npm run build

# Verify that the build was successful
if [ ! -d "dist" ]; then
  echo "❌ Build failed! The dist directory was not created."
  exit 1
fi

echo "✅ Build successful!"

# Check if Token Economy schema is properly set up
echo "Checking token economy configuration..."
if [ -z "$VITE_TOKEN_ECONOMY_SCHEMA" ]; then
  if grep -q "VITE_TOKEN_ECONOMY_SCHEMA" .env; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Token economy schema configured as: $VITE_TOKEN_ECONOMY_SCHEMA"
  else
    echo "⚠️ Warning: VITE_TOKEN_ECONOMY_SCHEMA is not set in .env file"
    echo "Setting default value to 'token_economy'"
    echo "VITE_TOKEN_ECONOMY_SCHEMA=token_economy" >> .env.production
  fi
fi

# Create required _headers file for Vercel
if [ ! -f "dist/_headers" ]; then
  echo "Creating dist/_headers file..."
  mkdir -p dist
  cat > dist/_headers << EOF
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
EOF
fi

echo "🎉 Deployment preparation complete!"
echo "Run 'vercel' to deploy to Vercel or use the deploy.sh script."
