# SottoTokenize Supabase Instance

This document outlines the approach for implementing SottoTokenize with a dedicated Supabase instance.

## Overview

Instead of using a schema-based approach within the existing Supabase project, we've decided to create a completely separate Supabase instance for SottoTokenize. This provides better isolation, security, and scalability for the token economy.

## Separate Instance Structure

The SottoTokenize implementation uses a dedicated Supabase instance with its own URL, anon key, and service key. All token-related tables and functions are created in the public schema of this separate instance.

### Benefits of Separate Instance

1. **Complete Isolation**: Token data is completely separated from the main application.
2. **Enhanced Security**: Access to token data requires separate credentials.
3. **Independent Scaling**: The token economy can scale independently from the main application.
4. **Cleaner Architecture**: Each instance has a single, well-defined responsibility.
5. **Simplified Database Structure**: No need for schema separation within a project.
6. **Risk Mitigation**: Issues in one system won't affect the other.

## Implementation

The SottoTokenize implementation consists of:

1. Separate Supabase instance: A completely new project dedicated to the token economy
2. Tables: user_token_balances, token_transactions, story_token_data, nft_collections, nft_items, etc.
3. Functions: For managing token balances, transactions, and metadata

## Environment Configuration

To use SottoTokenize, you need to set the following in your `.env` file:

```
VITE_TOKEN_ECONOMY_SUPABASE_URL=your-sottotokenize-url
VITE_TOKEN_ECONOMY_SUPABASE_ANON_KEY=your-sottotokenize-anon-key
VITE_TOKEN_ECONOMY_SERVICE_KEY=your-sottotokenize-service-key
```

These credentials are used by the `tokenEconomySupabase` client to connect to the SottoTokenize instance.

## Setup

To set up the SottoTokenize instance and tables, follow these steps:

1. Create a new Supabase project specifically for SottoTokenize
2. Add your new Supabase URL and keys to your `.env` file
3. Run the setup script:

```bash
# Interactive guided setup
node scripts/create-sottotokenize-project.js

# Or manual setup
node scripts/setup-token-economy.js
```

This script will create the necessary tables, functions, and initial data in your SottoTokenize instance.

## Database Structure

The token economy data is organized into these tables in the SottoTokenize instance:

1. `user_token_balances` - User's token balance information
2. `token_transactions` - Records of all token movements
3. `story_token_data` - Token metrics for each story
4. `nft_collections` and `nft_items` - For future NFT features
