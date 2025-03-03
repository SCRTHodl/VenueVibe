# SottoCity User Guide

## Table of Contents
1. [User Interface Navigation](#user-interface-navigation)
2. [Admin Panel Management](#admin-panel-management)
3. [Theme Customization](#theme-customization)
4. [AI Feature Integration](#ai-feature-integration)

## User Interface Navigation

### Logging In and Access
1. Open SottoCity in your browser
2. Click "Login" in the top right
3. Enter your credentials or sign up for a new account
4. Upon successful login, you'll be directed to the main dashboard

### Core Features

#### Main Dashboard
- **Feed**: Central area showing posts and stories
- **Map View**: Toggle using the "Map" button in top right
- **Navigation**: Bottom bar with key sections:
  - Home: Main content feed
  - Explore: Discover new places
  - Create: Share stories/posts
  - Rankings: User leaderboards
  - Store: Token marketplace

#### Stories & Posts
- Create stories via the "+" button
- Share posts about venues
- React with likes, comments, and tokens
- Stories expire after 24 hours

#### Map Features
- Real-time venue activity
- User heatmap
- Interactive venue markers
- RydeQuest integration

## Admin Panel Management

### Accessing Admin Panel
1. Log in with admin credentials
2. Navigate to `/admin` route
3. Verify admin permissions

### Administrative Functions

#### Content Moderation
```typescript
// Access moderation dashboard
const ModerationDashboard = () => {
  // Review pending content
  // Approve/reject items
  // Set moderation filters
};
```

#### User Management
```typescript
// Manage users
const UserManagement = () => {
  // View user list
  // Modify user status
  // Review user activity
};
```

#### System Settings
```typescript
// Configure system settings
const AdminSettings = () => {
  // Update global settings
  // Manage permissions
  // Configure AI behavior
};
```

### Security Best Practices
1. Use strong passwords
2. Enable 2FA when available
3. Regular security audits
4. Monitor admin activity logs

## Theme Customization

### Accessing Theme Settings
1. Click profile icon
2. Select "Theme Customizer"
3. Choose from presets or create custom theme

### Available Customizations
```typescript
interface AppTheme {
  primary: string;    // Primary accent color
  secondary: string;  // Secondary accent color
  accent: string;     // Highlight color
  background: string; // Main background
  cardBackground: string; // Card backgrounds
  textPrimary: string;   // Main text color
  textSecondary: string; // Secondary text
}
```

### Event Themes
- Special themes for events
- Automatic color scheme updates
- Custom UI elements
- Themed content filters

### Saving & Applying Themes
1. Preview changes in real-time
2. Save theme configuration
3. Apply theme globally
4. Share theme with others

## AI Feature Integration

### AI Assistant (Jessica)
- Voice-activated helper
- Natural language commands
- Context-aware responses
- Integration with platform features

#### Available Commands
```typescript
// Example AI commands
const commands = {
  "share with nearest device": handleShareCommand,
  "filter content": handleFilterCommand,
  "find venues": handleVenueSearch,
  "manage contacts": handleContactManagement
};
```

### Content Filtering
```typescript
// AI content moderation
const checkContentModeration = async (
  contentType: 'story' | 'post' | 'comment',
  text: string,
  mediaUrl?: string
): Promise<ModerationResult>
```

### Custom Instructions
Admins can create custom AI instructions:
```typescript
interface AIInstruction {
  inviteCode: string;
  name: string;
  description: string;
  instructions: {
    contentTypes: string[];
    tone: string;
    focus: string;
    prohibited: string[];
  };
  knowledgeBase: Record<string, string[]>;
  contentFilters: Record<string, {
    keywords: string[];
    categories: string[];
    minScore: number;
  }>;
}
```

### Troubleshooting AI Features

#### Common Issues
1. Voice Recognition
   - Check microphone permissions
   - Verify browser support
   - Test in quiet environment

2. Content Filtering
   - Review filter settings
   - Check moderation thresholds
   - Verify AI service status

3. Custom Instructions
   - Validate instruction format
   - Check invite code linkage
   - Monitor filter effectiveness

## Best Practices

### Content Creation
1. Use high-quality images
2. Write clear descriptions
3. Add relevant tags
4. Follow community guidelines

### Engagement
1. Respond to comments
2. Share quality content
3. Participate in events
4. Build reputation

### Token Economy
1. Earn tokens through participation
2. Spend wisely on features
3. Monitor token balance
4. Engage with rewards system

## Support Resources

### Documentation
- API Reference
- Component Library
- Style Guide
- Security Guidelines

### Contact Support
- Technical Issues
- Account Problems
- Feature Requests
- Bug Reports

## Updates and Maintenance

### Version Control
- Track changes in CHANGELOG
- Review release notes
- Update dependencies
- Monitor performance

### Backup and Recovery
1. Regular data backups
2. User content preservation
3. System state recovery
4. Error logging

## Security Guidelines

### Data Protection
1. Encrypt sensitive data
2. Regular security audits
3. Access control policies
4. Privacy compliance

### User Safety
1. Content moderation
2. User verification
3. Report system
4. Safety features

## Future Development

### Planned Features
1. Enhanced AI capabilities
2. Advanced analytics
3. More customization options
4. Expanded token economy

### Community Feedback
- Feature requests
- Bug reports
- User suggestions
- Performance metrics