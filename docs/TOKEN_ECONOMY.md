# Token Economy System

This document outlines how to set up and use the token economy features in the application, using a separate Supabase instance to avoid affecting the original database.

## Setup Instructions

### 1. Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/) and create a new project
2. Choose a name like "[Your Original Project Name] - Token Economy"
3. Choose a strong database password (save it somewhere secure)
4. Select the region closest to your users
5. Wait for the project to be created

### 2. Apply Migrations

1. Connect to your new Supabase project's SQL Editor
2. Copy the contents of the migration file at:
   ```
   /supabase/migrations/token-economy/20250302_token_economy_setup.sql
   ```
3. Paste it into the SQL Editor and run the queries

### 3. Configure Environment Variables

1. Copy the `.env.token-economy` file to create a new `.env.local` file:
   ```
   cp .env.token-economy .env.local
   ```

2. Update the `.env.local` file with:
   - Your original Supabase URL and key (preserve these)
   - Your new token economy Supabase URL and key
   - Keep other environment variables as needed

3. The important variables to set are:
   ```
   VITE_TOKEN_ECONOMY_SUPABASE_URL=https://your-token-project-id.supabase.co
   VITE_TOKEN_ECONOMY_SUPABASE_ANON_KEY=your-token-project-anon-key
   ```

## Token Economy Features

### User Story Rewards

- **Creation**: Users earn tokens for creating stories
  - Base reward: 5 tokens per story
  - Location bonus: +2 tokens
  - Video content: +3 tokens
  - Tags: +1 token per tag

- **Engagement**: Users earn tokens for:
  - Views on their stories
  - Likes and comments
  - Shares of their content

### Tipping System

Users can tip each other for content they enjoy:
- Available tip amounts: 5, 10, and 25 tokens
- Tips are transferred instantly from tipper to creator
- Transactions are recorded in the token economy database

### NFT Creation (Future Feature)

- Users can mint their most popular stories as NFTs
- NFT ownership is tracked in the token economy database
- NFTs can be bought, sold, and traded with tokens

## System Architecture

The token economy uses a separate Supabase instance to isolate it from the main application data. Key components:

1. **Token Balance System**
   - Each user has a token balance record
   - Balances update automatically via database triggers
   - Cached locally for performance

2. **Transaction System**
   - All token movements create transaction records
   - Transactions have types (reward, tip, purchase, etc.)
   - Automatic completion for reward transactions

3. **Story Token Data**
   - Each story tracks token-related metrics
   - Creator earnings
   - Viewer rewards
   - Tip accumulation

## Integration Points

### Story Creation

When a user creates a story, the system:
1. Calculates the token reward based on content
2. Creates a creation_reward transaction
3. Updates the user's balance
4. Creates story token data record

### Story Viewing

When viewing stories, the system:
1. Shows token-related UI (creator balance, tip options)
2. Records view statistics for later rewards
3. Enables tipping functionality

### User Profiles

User profiles display:
1. Current token balance
2. Lifetime earnings
3. Top-earning stories
4. NFT collection (future)

## Troubleshooting

### Balance Discrepancies

If token balances seem incorrect:
1. Check the `token_transactions` table for the user
2. Verify that transactions have the correct status
3. Run manual balance recalculation if needed

### Transaction Failures

For failed transactions:
1. Check the transaction status and error in the database
2. Verify the user has sufficient balance for spending transactions
3. Check that the database triggers are functioning properly

## Development Guidelines

When extending the token economy:

1. Always use the separate Supabase client:
   ```typescript
   import { tokenEconomySupabase } from '../lib/supabase/tokenEconomy';
   ```

2. Use the provided helper functions for token operations:
   ```typescript
   import { 
     getUserTokenBalance, 
     createTokenTransaction, 
     processCreationReward 
   } from '../lib/supabase/tokenEconomy';
   ```

3. Keep token calculations consistent with environment variables:
   ```typescript
   const baseReward = parseInt(import.meta.env.VITE_TOKEN_CREATION_BASE_REWARD || '5');
   ```

4. Test thoroughly with test accounts before deploying to production
