#!/bin/bash

# Exit on error
set -e

echo "🔍 Running pre-deployment health check..."

# Check for environment variables
echo "Checking environment variables..."
MISSING_VARS=0

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ VITE_SUPABASE_URL is not set in environment"
    MISSING_VARS=1
else
    echo "✅ VITE_SUPABASE_URL is set"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ VITE_SUPABASE_ANON_KEY is not set in environment"
    MISSING_VARS=1
else
    echo "✅ VITE_SUPABASE_ANON_KEY is set"
fi

# Check for .env file
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file is missing"
    MISSING_VARS=1
fi

# Check for required directories and files
if [ -d "public" ]; then
    echo "✅ public directory exists"
else
    echo "❌ public directory is missing"
    exit 1
fi

if [ -f "public/_headers" ]; then
    echo "✅ public/_headers file exists"
else
    echo "⚠️ public/_headers file is missing, this will be created during deployment"
fi

if [ -f "vercel.json" ]; then
    echo "✅ vercel.json file exists"
else
    echo "⚠️ vercel.json file is missing, this will be created during deployment"
fi

# Check for required dependencies
echo "Checking for required dependencies..."
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json is missing"
    exit 1
fi

# Run a build test
echo "Running build test..."
npm run build

echo "✅ Build test successful"

# Check camera functionality
echo "Testing camera access..."
echo "Note: Camera functionality requires browser permissions and cannot be tested in this script."
echo "Ensure you've tested camera functionality manually before deployment."

# Final summary
if [ $MISSING_VARS -eq 0 ]; then
    echo "✅ All environment variables are set"
else
    echo "❌ Some environment variables are missing"
    echo "Please set the missing variables in your .env file or in your environment"
fi

echo "🏁 Health check completed"
