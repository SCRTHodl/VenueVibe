# Agent Memory System Guide

## Overview

The Agent Memory System enables AI agents to maintain persistent memory across conversations, customize behaviors based on user preferences, and access specialized tools. This document explains how to use and configure the system.

## Key Components

### Memory Management

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
```

The Memory Manager handles:
- Storing and retrieving memories based on context
- Searching for relevant memories during conversations
- Automatically pruning low-importance memories
- Managing memory importance and expiration dates

#### Memory Context Types

- `conversation`: Dialogue history between user and AI
- `preference`: User preferences and settings
- `profile`: User profile information
- `event`: Significant events or milestones 
- `relationship`: Information about user relationships
- `environment`: Contextual information about user environment
- `task`: Task or goal related memory
- `knowledge`: Factual knowledge that might be useful

#### Usage Example

```typescript
import { MemoryManager, calculateExpirationDate } from '../lib/agent/memoryManager';

// Create a memory manager for a user
const memoryManager = new MemoryManager(userId);

// Create a new memory
await memoryManager.createMemory({
  contextType: 'preference',
  content: {
    text: 'User prefers dark theme and concise responses',
    metadata: { theme: 'dark', responseStyle: 'concise' }
  },
  importance: 8,
  expiresAt: calculateExpirationDate(8)
});

// Search for relevant memories
const results = await memoryManager.searchMemories('theme preferences', {
  contextTypes: ['preference'],
  limit: 5
});
```

### Tool Management

```typescript
interface AgentTool {
  id?: string;
  name: string;
  description: string;
  toolType: ToolType;
  permissions: {
    admin: boolean;
    premium: boolean;
    basic: boolean;
  };
  tokenCost: number;
  rateLimit?: {
    maxRequests: number;
    timeWindow: number; // in seconds
  };
  createdAt?: string;
  updatedAt?: string;
}
```

The Tool Manager provides:
- Registration and execution of specialized AI tools
- Permission-based access control
- Token cost and rate limiting for tool usage
- Usage tracking for analytics

#### Tool Types

- `external_api`: Calls to external APIs (web search, etc.)
- `ai_service`: AI-specific services (image generation, etc.)
- `internal_service`: Internal operations (database queries, etc.)
- `social`: Social interactions (group chat, etc.)
- `custom`: Custom tools with specialized functionality

#### Usage Example

```typescript
import { ToolManager } from '../lib/agent/toolManager';

// Create a tool manager for a user
const toolManager = new ToolManager(userId, 'premium');
await toolManager.initialize();

// Register a custom tool
toolManager.registerToolExecutor('translate', async (params) => {
  // Implement translation logic
  return { translatedText: `Translated: ${params.text}` };
});

// Execute a tool
const result = await toolManager.executeTool('web_search', {
  query: 'latest tech news'
});
```

### Behavior Management

```typescript
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
  toolsAllowed?: string[]; // IDs of allowed tools
  memoryConfig?: {
    retentionPeriod?: number; // in days
    maxMemories?: number;
    prioritizeCategories?: MemoryContextType[];
  };
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}
```

The Behavior Manager handles:
- Loading and managing agent behaviors
- Linking behaviors to invite codes
- Customizing system prompts, personality, and goals
- Configuring memory and tool access for specific behaviors

#### Usage Example

```typescript
import { BehaviorManager, generateSystemPrompt } from '../lib/agent/behaviorManager';

// Create a behavior manager
const behaviorManager = new BehaviorManager();

// Load available behaviors
const behaviors = await behaviorManager.loadBehaviors();

// Create a new behavior
await behaviorManager.createBehavior({
  name: 'Friendly Assistant',
  description: 'A helpful, friendly assistant for general use',
  behaviorConfig: {
    systemPrompt: generateSystemPrompt({
      personality: 'friendly, helpful, and patient',
      responseStyle: 'conversational but concise',
      priorityTopics: ['productivity', 'wellness']
    }),
    primaryGoal: 'assist users with daily tasks'
  },
  toolsAllowed: ['web_search', 'database_query'],
  memoryConfig: {
    maxMemories: 50,
    prioritizeCategories: ['preference', 'task']
  }
}, userId);
```

### Agent Coordinator

The Agent Coordinator ties all components together:
- Initializes memory, tool, and behavior subsystems
- Processes user messages with memory retrieval
- Executes tools with permission checks
- Maintains user role and behavior configuration

#### Usage Example

```typescript
import { getAgentCoordinator } from '../lib/agent/agentCoordinator';

// Get the agent coordinator
const agent = await getAgentCoordinator();

// Process a user message
const { response, memoryId } = await agent.processUserMessage(
  'What are my theme preferences?',
  conversationId
);

// Execute a tool
const webSearchResult = await agent.executeTool('web_search', {
  query: 'weather forecast'
});
```

## React Integration

```typescript
interface UseAgentReturn {
  agent: AgentCoordinator | null;
  isInitializing: boolean;
  isReady: boolean;
  error: string | null;
  currentBehavior: AgentBehavior | null;
  createMemory: Function;
  retrieveRelevantMemories: Function;
  executeTool: Function;
  processUserMessage: Function;
  loadBehavior: Function;
  loadBehaviorByInviteCode: Function;
  cleanup: Function;
}
```

The useAgent hook provides easy access to the Agent System:
- Auto-initialization with behavior or invite code
- Memory and tool operation wrappers
- Error handling and state management
- Cleanup functions for resource management

#### Usage Example

```tsx
import { useAgent } from '../hooks/useAgent';

function ChatComponent() {
  const { 
    agent, 
    isReady, 
    processUserMessage, 
    currentBehavior 
  } = useAgent({
    autoInitialize: true,
    inviteCode: 'PREMIUM123'
  });

  const handleSendMessage = async (message) => {
    if (!isReady) return;
    
    const { response } = await processUserMessage(
      message,
      'conversation-123'
    );
    
    // Update UI with response
  };

  return (
    <div>
      {currentBehavior && (
        <div>AI Personality: {currentBehavior.name}</div>
      )}
      {/* Chat UI */}
    </div>
  );
}
```

## Database Schema

The Agent Memory System uses the `agent_system` schema with these tables:

- `agent_memories`: Stores agent memories with context types and importance levels
- `agent_tools`: Defines available tools with permissions and token costs
- `tool_usage_history`: Tracks usage of tools by users
- `agent_behaviors`: Stores customizable agent behaviors linked to invite codes

## Admin Features

### Memory Management

Admins can:
- View and manage user memories
- Set importance levels and expiration dates
- Create global memories shared across users
- Monitor memory usage statistics

### Tool Configuration

Admins can:
- Register new tools and set permissions
- Configure token costs and rate limits
- Monitor tool usage analytics
- Enable/disable tools for specific user groups

### Behavior Customization

Admins can:
- Create and manage agent behaviors
- Link behaviors to invite codes
- Configure system prompts and personalities
- Control memory retention and tool access

## Best Practices

### Memory Creation

1. **Importance Level Guidelines**:
   - 9-10: Critical user preferences that should never expire
   - 7-8: Important long-term preferences (theme, language)
   - 5-6: Medium-term context (ongoing projects)
   - 3-4: Short-term information (recent discussions)
   - 1-2: Temporary context (current session only)

2. **Context Types**:
   - Use appropriate context types for better searching
   - Add relevant metadata for richer context
   - Set appropriate expiration dates based on importance

### Tool Usage

1. **Performance Considerations**:
   - Set appropriate rate limits to prevent overuse
   - Consider token costs based on computational expense
   - Monitor tool usage patterns for optimization

2. **Security Practices**:
   - Restrict sensitive tools to admin/premium users
   - Validate inputs before execution
   - Implement proper error handling

### Behavior Configuration

1. **System Prompts**:
   - Be specific about personality and response style
   - Include clear guidelines for appropriate topics
   - Define key goals and objectives

2. **Memory Configuration**:
   - Set appropriate retention periods
   - Prioritize important memory categories
   - Configure maximum memory limits based on user tier

## Troubleshooting

### Common Issues

1. **Memory Retrieval**:
   - Check importance levels (too low = early pruning)
   - Verify context types are appropriate
   - Check if memories have expired

2. **Tool Execution**:
   - Verify user has necessary permissions
   - Check token balance is sufficient
   - Ensure tool is registered and initialized
   - Verify rate limits haven't been exceeded

3. **Behavior Loading**:
   - Confirm invite code is valid and linked
   - Check behavior ID exists
   - Verify user has access to that behavior

### Debugging

Add detailed logging to trace issues:

```typescript
// Memory debugging
console.log('[MemoryManager] Searching memories:', query, options);
console.log('[MemoryManager] Found memories:', results.length);

// Tool debugging
console.log('[ToolManager] Executing tool:', toolName, params);
console.log('[ToolManager] Tool result:', result);

// Behavior debugging
console.log('[BehaviorManager] Loading behavior:', behaviorId);
console.log('[BehaviorManager] Current behavior:', behavior);
```
