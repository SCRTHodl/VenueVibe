# Token Economy Edge Function

This Edge Function provides secure access to the `token_economy` schema in Supabase without exposing the service role key in client-side code.

## Overview

The Token Economy Edge Function securely handles operations on the token_economy schema by:

1. Running server-side with the service role key
2. Validating user authentication via JWT token
3. Providing a secure API for wallet operations, token transactions, and other token economy functionality
4. Following the correct schema access pattern of using `.schema('token_economy').from()` as documented in your codebase

## Deployment

### Local Development

1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Run the local development server:
   ```bash
   supabase start
   supabase functions serve
   ```

### Production Deployment

1. Deploy the function to your Supabase project:
   ```bash
   supabase functions deploy token-economy
   ```

2. Set the environment variables in the Supabase Dashboard:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Add the following secrets:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Security Considerations

This function:
- Validates users via their JWT token before allowing any operations
- Only allows operations on the token_economy schema that the user has permission to perform
- Maintains data ownership by attaching the user_id to all records
- Prevents direct client-side access to the token_economy schema with service role privileges

## Client Usage

Use the provided `tokenEconomyClient.ts` utility to interact with this edge function. The client handles:
- Authentication token management
- Request formatting
- Error handling
- Local state management

Example:
```typescript
import { tokenEconomyClient } from '../utils/tokenEconomyClient';

// Get user wallet
const { data, error } = await tokenEconomyClient.getWallet();

// Perform token transaction
await tokenEconomyClient.insert('token_transactions', {
  type: 'earn',
  amount: 10,
  reason: 'Daily reward'
});
```
