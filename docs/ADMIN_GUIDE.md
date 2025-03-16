# SottoCity Admin Panel Guide

## Overview

The SottoCity admin panel provides comprehensive tools for managing content, users, and system settings. This guide covers key administrative functions and best practices.

## Access & Security

### Authentication
- Admin access requires special permissions
- Two-factor authentication recommended
- Session timeouts after 30 minutes of inactivity

### Security Best Practices
1. Use strong, unique passwords
2. Enable 2FA when available
3. Never share admin credentials
4. Log out after each session
5. Review audit logs regularly

## Core Features

### Content Moderation
```typescript
interface ModerationItem {
  id: string;
  contentType: 'story' | 'post' | 'comment';
  content: string;
  mediaUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  score: number;
}
```

#### Moderation Actions
- Review pending content
- Approve/reject items
- Set content filters
- Monitor AI moderation scores

### User Management
```typescript
interface User {
  id: string;
  email: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  lastActive: string;
  reputationScore: number;
}
```

#### User Controls
- View user profiles
- Manage permissions
- Handle reports
- Issue warnings/bans

### AI Instructions
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

#### AI Configuration
- Create custom instructions
- Define content filters
- Set up knowledge bases
- Monitor AI performance

### Agent Memory System
```typescript
interface AgentMemory {
  id?: string;
  userId: string;
  contextType: MemoryContextType;
  content: {
    text: string;
    metadata?: Record<string, any>;
    source?: string;
  };
  importance: number; // 1-10, 10 being most important
  vectorEmbedding?: number[];
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
}

interface AgentBehavior {
  id?: string;
  name: string;
  description?: string;
  inviteCodeId?: string;
  behaviorConfig: {
    systemPrompt: string;
    primaryGoal?: string;
    personality?: string;
    responseStyle?: string;
    priorityTopics?: string[];
    avoidanceTopics?: string[];
  };
  toolsAllowed?: string[];
  memoryConfig?: {
    retentionPeriod?: number;
    maxMemories?: number;
    prioritizeCategories?: MemoryContextType[];
  };
}
```

#### Memory Management
- View and manage user memories
- Set importance levels and expiration dates
- Create global memories shared across users
- Monitor memory usage statistics

#### Tool Management
- Register new tools with permissions
- Configure token costs and rate limits
- Monitor tool usage analytics
- Enable/disable tools for specific user groups

#### Behavior Configuration
- Create agent personalities and behaviors
- Link behaviors to invite codes
- Configure system prompts and response styles
- Control memory retention and tool access

## Database Management

### Key Tables

#### Content Moderation
```sql
CREATE TABLE content_moderation (
  id uuid PRIMARY KEY,
  content_type text NOT NULL,
  content_id text NOT NULL,
  moderation_status text DEFAULT 'pending',
  moderation_score float8,
  created_at timestamptz DEFAULT now()
);
```

#### Admin Users
```sql
CREATE TABLE admin_users (
  id uuid PRIMARY KEY,
  role text NOT NULL,
  permissions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
```

#### AI Instructions
```sql
CREATE TABLE ai_instructions (
  id uuid PRIMARY KEY,
  invite_code text UNIQUE,
  instructions jsonb NOT NULL,
  knowledge_base jsonb,
  created_at timestamptz DEFAULT now()
);

#### Agent Memory System
```sql
CREATE SCHEMA agent_system;

CREATE TABLE agent_system.agent_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  context_type text NOT NULL,
  content jsonb NOT NULL,
  importance int NOT NULL,
  vector_embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE agent_system.agent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  tool_type text NOT NULL,
  permissions jsonb NOT NULL,
  token_cost int NOT NULL,
  rate_limit jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE agent_system.tool_usage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  tool_id uuid REFERENCES agent_system.agent_tools NOT NULL,
  tokens_spent int NOT NULL,
  success boolean NOT NULL,
  error_message text,
  request_data jsonb,
  result_summary text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE agent_system.agent_behaviors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  invite_code_id uuid REFERENCES invite_codes(id),
  behavior_config jsonb NOT NULL,
  tools_allowed text[],
  memory_config jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users
);
```
```

### Backup & Recovery
1. Daily automated backups
2. Point-in-time recovery
3. Disaster recovery plan
4. Data retention policies

## Monitoring & Analytics

### Key Metrics
- Active users
- Content engagement
- Moderation stats
- System performance

### Alerts
- High priority items
- System issues
- Security events
- Performance problems

## Troubleshooting

### Common Issues

1. Content Moderation
   - Check AI service status
   - Verify filter settings
   - Review moderation logs

2. User Management
   - Validate permissions
   - Check audit trails
   - Review recent actions

3. System Performance
   - Monitor resource usage
   - Check error logs
   - Review database queries

### Error Handling
```typescript
try {
  await moderateContent(item);
} catch (error) {
  console.error('Moderation error:', error);
  await notifyAdmins({
    type: 'moderation_error',
    itemId: item.id,
    error: error.message
  });
}
```

## Best Practices

### Content Moderation
1. Review high-priority items first
2. Document moderation decisions
3. Be consistent with guidelines
4. Monitor AI accuracy

### User Management
1. Follow escalation procedures
2. Document user interactions
3. Apply penalties fairly
4. Keep communication professional

### System Administration
1. Regular security audits
2. Update documentation
3. Monitor performance
4. Test new features

## API Reference

### Moderation API
```typescript
// Check content moderation
async function checkModeration(
  contentType: string,
  content: string
): Promise<ModerationResult>

// Update moderation status
async function updateStatus(
  itemId: string,
  status: 'approved' | 'rejected'
): Promise<void>
```

### User Management API
```typescript
// Update user status
async function updateUserStatus(
  userId: string,
  status: 'active' | 'suspended' | 'banned'
): Promise<void>

// Get user activity
async function getUserActivity(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Activity[]>
```

### AI Configuration API
```typescript
// Create AI instruction
async function createInstruction(
  instruction: AIInstruction
): Promise<string>

// Update AI filters
async function updateFilters(
  instructionId: string,
  filters: ContentFilter[]
): Promise<void>
```

## Security Guidelines

### Access Control
1. Role-based permissions
2. Least privilege principle
3. Regular access reviews
4. Session management

### Data Protection
1. Encryption at rest
2. Secure transmission
3. Data retention
4. Privacy compliance

### Audit Logging
1. Track all admin actions
2. Monitor suspicious activity
3. Regular log reviews
4. Retention policies

## Emergency Procedures

### System Issues
1. Check status page
2. Follow escalation path
3. Notify stakeholders
4. Document incident

### Security Incidents
1. Isolate affected systems
2. Gather evidence
3. Follow response plan
4. Update security

### Data Recovery
1. Identify data loss
2. Select recovery point
3. Execute recovery
4. Verify integrity

## Updates & Maintenance

### Version Control
1. Track changes
2. Review updates
3. Test thoroughly
4. Document changes

### Performance Optimization
1. Monitor metrics
2. Identify bottlenecks
3. Implement fixes
4. Verify improvements

## Support Resources

### Documentation
- API Reference
- System Architecture
- Security Guidelines
- Best Practices

### Contact Information
- Technical Support
- Security Team
- Development Team
- Management