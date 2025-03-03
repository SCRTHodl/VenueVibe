# Token Economy Schema Approach

Instead of using a separate Supabase project for the token economy, we're now using a schema-based approach that keeps everything in your existing Supabase project.

## How It Works

1. **Schema Separation**: All token economy tables are created in a dedicated `token_economy` schema (instead of the default `public` schema)
2. **Same Database**: Everything stays in the same database, just organized in different schemas
3. **Same Credentials**: We use the same Supabase URL and API key

## Benefits

- **Simplicity**: No need to maintain two separate Supabase projects
- **Cost-effective**: Only one Supabase project to pay for
- **Better Integration**: Data can be joined across schemas if needed
- **Easier Authentication**: Users don't need to be duplicated across projects

## Setup Instructions

1. **Update Environment Variables**:
   ```
   # Add this to your .env file
   VITE_TOKEN_ECONOMY_SCHEMA=token_economy
   ```

2. **Run Migration Script**:
   ```bash
   node scripts/setup-token-economy.js
   ```

3. **Test The Feature**:
   Make sure the token economy features are working with the schema-based approach.

## Changes Made

1. Updated `tokenEconomy.ts` to use schema-based configuration
2. Modified SQL migration script to explicitly use the `token_economy` schema
3. Updated setup script to work with the existing Supabase project
4. Simplified environment variables (removed need for separate keys)

## Database Structure

The token economy data is organized into these tables (all within the `token_economy` schema):

1. `user_token_balances` - User's token balance information
2. `token_transactions` - Records of all token movements
3. `story_token_data` - Token metrics for each story
4. `nft_collections` and `nft_items` - For future NFT features

## Supabase Dashboard Access

To view your token economy tables in the Supabase dashboard:

1. Login to your Supabase project
2. Go to Table Editor
3. Change the schema dropdown from "public" to "token_economy"
4. You'll see all your token economy tables there

## Troubleshooting

If you encounter issues:

1. Check that the `token_economy` schema exists in your Supabase project
2. Verify that the `VITE_TOKEN_ECONOMY_SCHEMA` environment variable is set
3. Make sure the migration script ran successfully
4. Check the Supabase logs for any errors related to the token economy tables
