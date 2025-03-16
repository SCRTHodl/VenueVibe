# MapChat - Local Influence Network

A real-time social platform for discovering and engaging with local venues, events, and communities with an integrated token economy and NFT capabilities.

![Status](https://img.shields.io/badge/status-ready%20for%20deployment-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

## Project Overview

MapChat is a modern social platform that combines location-based discovery with real-time social features. Users can explore local venues, share stories, and engage with event-specific content through a token-based economy.

### Key Features

- Interactive venue map with real-time activity heatmap
- Story sharing with AI-powered moderation
- Event-specific themes and custom experiences
- Token-based economy for creation and engagement rewards
- NFT minting capabilities for popular stories
- Tipping system for creator support
- Real-time chat with 5-minute message expiry
- Admin panel with content moderation tools
- Token economy with dedicated schema design

## Technical Architecture

### Database Schema

#### Core Tables

1. **stories**
   - Handles user-generated story content
   - Includes media, captions, and moderation status
   - Auto-expires after 24 hours
   ```sql
   CREATE TABLE stories (
     id uuid PRIMARY KEY,
     user_id uuid REFERENCES auth.users(id),
     media jsonb NOT NULL,
     caption text,
     expires_at timestamptz NOT NULL,
     moderation_status text DEFAULT 'pending'
   );
   ```

2. **messages**
   - Real-time chat messages
   - 5-minute auto-expiry
   - Supports guest users
   ```sql
   CREATE TABLE messages (
     id uuid PRIMARY KEY,
     group_id uuid NOT NULL,
     user_id uuid REFERENCES auth.users(id),
     content text NOT NULL,
     channel text DEFAULT 'general'
   );
   ```

3. **digital_items**
   - NFTs, badges, and virtual gifts
   - Supports token economy
   ```sql
   CREATE TABLE digital_items (
     id uuid PRIMARY KEY,
     name text NOT NULL,
     price integer NOT NULL,
     item_type text CHECK (item_type IN ('nft', 'gift', 'badge', 'theme'))
   );
   ```

#### AI & Moderation

1. **content_moderation**
   - Handles AI-powered content moderation
   - Tracks moderation decisions and feedback
   ```sql
   CREATE TABLE content_moderation (
     id uuid PRIMARY KEY,
     content_type text NOT NULL,
     moderation_status text DEFAULT 'pending',
     moderation_score float8
   );
   ```

2. **ai_instructions**
   - Custom AI behavior per invite code
   - Content filtering rules
   ```sql
   CREATE TABLE ai_instructions (
     id uuid PRIMARY KEY,
     invite_code text REFERENCES invite_codes(code),
     instructions jsonb NOT NULL,
     content_filters jsonb
   );
   ```

### Migration History

1. Initial Schema (20250126221826_yellow_coast.sql)
   - Basic tables setup
   - PostGIS integration
   - Row Level Security

2. User Management (20250127001117_wooden_oasis.sql)
   - Email subscriptions
   - Update notifications

3. Token System (20250131231040_divine_grove.sql)
   - Version tracking
   - Token economy tables

4. Chat System (20250131231416_blue_surf.sql)
   - Real-time messaging
   - Channel support

5. Stories Implementation (20250302172359_bold_block.sql)
   - Story creation and viewing
   - Like/comment functionality
   - Auto-expiry system

6. AI Integration (20250302173958_aged_bridge.sql)
   - AI instructions table
   - Content filtering system
   - Custom knowledge bases

7. Admin Panel (20250302174700_broken_tree.sql)
   - Admin API schema
   - Analytics views
   - Token management

8. Policy Fixes (20250302175137_yellow_summit.sql)
   - Fixed policy naming conflicts
   - Consolidated moderation functions
   - Enhanced security checks

### Component Structure

```
src/
├── components/
│   ├── Admin/              # Admin dashboard components
│   │   ├── ModerationDashboard.tsx
│   │   ├── UserManagement.tsx
│   │   └── AdminSettings.tsx
│   ├── Stories/           # Story creation/viewing
│   │   ├── StoryModal.tsx
│   │   ├── StoryView.tsx
│   │   └── Filters/
│   ├── Map/               # Interactive map components
│   ├── TokenEconomy/      # Token economy components
│   │   ├── TokenDisplay.tsx
│   │   └── TokenTransactionHistory.tsx
│   └── TokenStore/        # Token economy interface
├── lib/
│   ├── ai.ts             # AI integration utilities
│   ├── supabase/
│   │   ├── supabase.ts    # Main database client
│   │   └── tokenEconomy.ts # Token economy database client
│   └── tokenStore.ts      # Token management
└── types/
    └── index.ts          # TypeScript definitions
```

### Recent Changes

#### Stories Feature
- Added camera implementation with filters
- Implemented AI moderation
- Added story analytics
- Fixed policy conflicts

#### Admin Panel
- Added moderation dashboard
- Implemented user management
- Added AI instruction management
- Enhanced analytics views

## Token Economy System

The application includes a robust token economy with these key features:

### Token Earning

- **Story Creation**: Base reward of 5 tokens with bonuses for:
  - Including location (+2 tokens)
  - Creating video content (+3 tokens)
  - Adding tags (+1 token per tag)

- **Engagement**: Earn tokens when others interact with your content:
  - Story views
  - Likes and comments
  - Content sharing

### Token Spending

- **Tipping**: Send 5, 10, or 25 tokens to creators you appreciate
- **Premium Content Unlocking**: Spend tokens to access premium stories
- **NFT Minting**: Convert popular stories into NFTs
- **Premium Features**: Unlock enhanced story creation tools

### Technical Implementation

- **Dedicated Schema**: The token economy uses a dedicated `token_economy` schema within the main Supabase instance, providing separation of concerns while simplifying infrastructure
- **User Tokens**: Each user has a `tokens` property that maintains their current token balance
- **Transaction Tracking**: All token transactions are recorded with detailed metadata
- **Row-Level Security**: Strict RLS policies ensure users can only view and modify their own token data
- **Premium Content Verification**: Implemented token verification for premium content unlocks

### Admin Features

- **Token Management**: Administrators can view and modify user token balances
- **Transaction Overview**: View all token transactions across the platform
- **Security**: Admin features require:
  1. User has `is_admin=true` in the users table
  2. Service role key for admin operations
  3. RLS policies enforcing admin permission checks

## Recent Updates (March 2025)

### Token Economy Enhancements

1. **Consolidated Architecture**: The SottoTokenized feature now uses a dedicated schema within the main Supabase instance instead of a separate instance
2. **Improved Premium Content**: Enhanced the premium content unlock experience with better UI and user feedback
3. **Schema Migration**: All token economy tables now use the `token_economy` schema prefix
4. **Fixed TypeScript Errors**: Updated property names to ensure type consistency:
   - Changed `tokenBalance` references to `tokens` throughout the codebase
   - Added proper null handling for optional token properties
5. **Transaction Tracking**: Improved tracking for both token spenders and content creators
6. **Admin Interface Updates**: Enhanced token management in the admin dashboard

### Development Improvements

1. **Mock Data**: Added comprehensive mock data for development and testing purposes
2. **Import Structure**: Fixed module import paths to ensure proper TypeScript validation
3. **Documentation**: Updated documentation with the latest architecture details

- Uses the main Supabase instance with a dedicated schema for SottoTokenized
- Implements real-time balance updates using Supabase's realtime features
- Transaction history tracking for all token movements
- Clean organization of token economy data within the main database
- See `/docs/TOKEN_ECONOMY_SCHEMA.md` for detailed implementation details

## Development Guidelines

### Story Feature Implementation

The story feature requires careful coordination between:

1. Camera/Media Capture
   ```typescript
   const capturePhoto = () => {
     if (videoRef.current && canvasRef.current) {
       const video = videoRef.current;
       const canvas = canvasRef.current;
       canvas.width = video.videoWidth;
       canvas.height = video.videoHeight;
       const ctx = canvas.getContext('2d');
       // Apply filters and capture
     }
   };
   ```

2. Filter System
   ```typescript
   export const STORY_FILTERS = [
     { 
       id: 'vintage', 
       name: 'Vintage', 
       style: 'sepia(0.5) contrast(1.2)'
     },
     // Additional filters...
   ];
   ```

3. AI Moderation
   ```typescript
   const checkContentModeration = async (
     contentType: 'story' | 'post' | 'comment',
     text: string,
     mediaUrl?: string
   ): Promise<ModerationResult>
   ```

### Token Economy Integration

Token transactions should:
1. Use the token store hooks
2. Include proper error handling
3. Update UI immediately
4. Confirm server-side success

Example:
```typescript
const { earnTokens, spendTokens } = useTokenStore();

// Reward user for content
await earnTokens(
  TOKEN_ECONOMY.REWARDS.POST_LIKE,
  'Post received a like',
  postId
);

// Spend tokens on premium content
const success = await spendTokens(
  TOKEN_ECONOMY.COSTS.PREMIUM_CONTENT,
  'Purchased premium access',
  itemId
);
```

## Troubleshooting

### Common Issues

1. Camera Access
   - Check browser permissions
   - Verify HTTPS in production
   - Test on multiple devices

2. Real-time Updates
   - Verify Supabase subscriptions
   - Check RLS policies
   - Monitor connection status

3. Token Transactions
   - Validate balance before spend
   - Handle network errors
   - Update UI optimistically

### Migration Conflicts

When adding new migrations:
1. Check existing policy names
2. Use unique names for new policies
3. Drop existing policies first
4. Add proper error handling

Example fix for policy conflicts:
```sql
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "existing_policy_name" ON table_name;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
```

## Future Improvements

1. Enhanced AI Features
   - Custom training for content filtering
   - Personalized recommendations
   - Automated content tagging

2. Advanced Token Economy
   - NFT marketplace
   - Token staking
   - Premium subscriptions

3. Improved Media Handling
   - Better video compression
   - Advanced filters
   - AR/VR support

## Contributing

1. Create feature branches
2. Follow TypeScript guidelines
3. Add proper documentation
4. Include migration scripts
5. Test thoroughly

## License

Copyright © 2025 MapChat Inc. All rights reserved.