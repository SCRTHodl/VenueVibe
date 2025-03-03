# SottoTokenize Quick Start Guide

This guide will help you quickly set up the SottoTokenize project, a separate Supabase instance for token economy features.

## Why a Separate Instance?

SottoTokenize uses a dedicated Supabase instance to:
- Completely isolate token data from the main application
- Enhance security with separate credentials
- Allow independent scaling
- Simplify maintenance and monitoring
- Reduce risk of cross-contamination between systems

## Setup Instructions

### 1. Create Your SottoTokenize Supabase Project

The easiest way to set up SottoTokenize is to use our interactive setup script:

```bash
node scripts/create-sottotokenize-project.js
```

This script will:
- Guide you through creating a new Supabase project
- Help you collect the necessary credentials
- Update your environment files
- Run the migration script to set up the database

### 2. Manual Setup Alternative

If you prefer to set up SottoTokenize manually:

1. **Create a new Supabase project**:
   - Go to https://supabase.com/dashboard/projects
   - Click "New Project"
   - Name it "SottoTokenize" or similar
   - Choose a secure database password

2. **Get your credentials**:
   - In your Supabase dashboard, go to Project Settings > API
   - Copy the Project URL, anon key, and service_role key

3. **Update your environment file**:
   - Add these variables to your `.env` file:
     ```
     VITE_TOKEN_ECONOMY_SUPABASE_URL=your-sottotokenize-url
     VITE_TOKEN_ECONOMY_SUPABASE_ANON_KEY=your-sottotokenize-anon-key
     VITE_TOKEN_ECONOMY_SERVICE_KEY=your-sottotokenize-service-key
     ```

4. **Run the setup script**:
   ```bash
   node scripts/setup-token-economy.js
   ```

## Testing Your Setup

After completing the setup, verify that everything is working:

1. **Check database tables**:
   - Visit your SottoTokenize Supabase dashboard
   - Go to Table Editor
   - Verify that the token economy tables are created:
     - user_token_balances
     - token_transactions
     - story_token_data
     - nft_collections
     - nft_items

2. **Test the connection in your app**:
   - Start your development server
   - Create a test story to earn tokens
   - Check your token balance through the app interface

## Troubleshooting

If you encounter issues:

1. **Connection Problems**:
   - Verify your Supabase credentials in the environment files
   - Check if your Supabase project is active
   - Ensure your IP is not restricted in Supabase settings

2. **Missing Tables**:
   - Run the setup script again:
     ```bash
     node scripts/setup-token-economy.js
     ```

3. **Runtime Errors**:
   - Check for console errors in your browser
   - Verify that `src/lib/supabase/tokenEconomy.ts` is correctly using the SottoTokenize credentials

## Additional Resources

- For a detailed explanation of the architecture, see [SOTTOTOKENIZE_SUPABASE.md](./SOTTOTOKENIZE_SUPABASE.md)
- For SQL migration details, see [the migration file](../supabase/migrations/token-economy/20250302_token_economy_setup.sql)
- To modify the token economy client, see [tokenEconomy.ts](../src/lib/supabase/tokenEconomy.ts)
