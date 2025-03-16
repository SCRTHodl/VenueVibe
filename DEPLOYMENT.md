# Deployment Guide

This document provides instructions for deploying the app to Vercel and troubleshooting common issues.

## Prerequisites

- A [Vercel](https://vercel.com/) account
- [Supabase](https://supabase.com/) account with configured project
- Node.js and npm installed

## Environment Variables

Ensure the following environment variables are set in your Vercel project:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key for client-side access |
| `VITE_TOKEN_ECONOMY_SCHEMA` | The schema name for the token economy (default: 'token_economy') |

## Deployment Steps

### Option 1: Using the Deployment Script

1. Make sure the deployment script is executable:
   ```bash
   chmod +x deploy.sh
   ```

2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

3. Follow the prompts to set up your Vercel project.

### Option 2: Manual Deployment

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Camera Permissions

The app requires camera access for the Stories feature. If users experience issues:

1. Ensure the site is served over HTTPS
2. Verify that the Content Security Policy allows camera access
3. Check that users have granted camera permissions in their browser

### Supabase Connection Issues

If the app cannot connect to Supabase:

1. Verify that the Supabase URL and Anon Key are correctly set in the environment variables
2. Check that the Supabase project is active and not in maintenance mode
3. Ensure that the necessary tables and schemas exist in your Supabase project

### Token Economy Issues

The token economy feature uses the `token_economy` schema in your Supabase database:

1. Verify that the schema exists
2. Check that all required tables are created with the correct permissions
3. Ensure that Row Level Security (RLS) policies allow the necessary operations

## Health Check

Before deployment, run the health check script to verify your setup:

```bash
./health-check.sh
```

This will:
- Check for required environment variables
- Validate the presence of necessary files
- Run a build test
- Provide advice on any issues found

## Content Security Policy

The app requires a Content Security Policy that allows:

1. WebAssembly execution
2. Connecting to Supabase
3. Camera access

These are configured in the `public/_headers` file and `vercel.json`.
