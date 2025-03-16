# Token Economy System

## Overview

The SottoTokenized feature is implemented using a dedicated schema (`token_economy`) within the main Supabase instance. This approach simplifies the infrastructure while still maintaining proper separation of concerns.

For user-facing features, we use public schema proxies with Row-Level Security (RLS) policies to ensure secure access.

## Schema Architecture

The token economy system uses two schemas:

1. **token_economy schema**: Primary storage for all token-related data
2. **public schema**: Proxy tables with RLS policies for client-side access

## Key Tables

- **user_tokens**: Stores user token balances
- **token_transactions**: Records all token-related activities
- **invite_codes**: Tracks invite codes and associated token rewards
- **story_token_data**: Stores token metrics for stories
- **nft_collections/nft_items**: Manages NFT data for token rewards

## Access Strategy

The system implements a layered access approach:

1. **Regular Users**: Access data through public schema using anonymous key
2. **Admins**: Access both schemas with service role key and additional permissions

## Environment Configuration

Required environment variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The service role key is essential for admin operations and accessing the token_economy schema.

## API Functions

### Basic Token Operations

```typescript
// Get a user's token balance
const balance = await getUserTokenBalance(userId);

// Update a user's token balance
const newBalance = await updateUserTokenBalance(userId, amount);

// Record a token transaction
const transaction = await recordTokenTransaction({
  user_id: userId,
  amount: 100,
  transaction_type: 'reward',
  description: 'Daily login bonus'
});

// Get token transaction history
const transactions = await getUserTokenTransactions(userId);
```

### Advanced Token Operations

```typescript
// Create or get a user's token record
const userToken = await getOrCreateUserToken(userId);

// Get token economy stats (admin only)
const stats = await getTokenEconomyStats();
```

## Implementation Details

### Data Synchronization

Data between the public and token_economy schemas is kept in sync through database triggers. Any change in one schema is automatically reflected in the other.

### Schema Fallback Mechanism

The API implements a schema fallback mechanism:

1. First attempt to access data from the public schema
2. If unsuccessful, fall back to token_economy schema with elevated permissions
3. Log any fallbacks to help identify and resolve access issues

### Row-Level Security

RLS policies ensure that:

- Users can only view/modify their own data
- Admin operations are restricted to users with is_admin=true
- Certain operations can only be performed through service role access

## Development Guidelines

1. Always implement new token features in both schemas
2. Use the public schema for user-facing features
3. Use the token_economy schema for admin operations and system processes
4. Test all operations with both regular and admin users

## Troubleshooting

Common issues:

1. **Permission Errors**: Ensure service role key is properly configured
2. **Missing Data**: Check if data exists in one schema but not the other
3. **Trigger Failures**: Inspect database logs for trigger execution errors
