/**
 * Types and interfaces for the Agent Memory System
 */

export type MemoryContextType = 
  | 'conversation'  // Memory from a conversation
  | 'preference'    // User preference
  | 'profile'       // User profile information
  | 'event'         // Significant event
  | 'relationship'  // User relationships with others
  | 'environment'   // Contextual information about user environment
  | 'task'          // Task or goal related memory
  | 'knowledge';    // Factual knowledge

export interface AgentMemory {
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

export type ToolType = 
  | 'external_api'     // External API calls (web search, etc.)
  | 'ai_service'       // AI services (image generation, etc.)
  | 'internal_service' // Internal services (database queries, etc.)
  | 'social'           // Social interactions (group chat, etc.)
  | 'custom';          // Custom tools

export interface AgentTool {
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

export interface ToolUsageHistory {
  id?: string;
  userId: string;
  toolId: string;
  tokensSpent: number;
  success: boolean;
  errorMessage?: string;
  requestData?: Record<string, any>;
  resultSummary?: string;
  createdAt?: string;
}

export interface AgentBehavior {
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

export interface MemorySearchResult {
  memory: AgentMemory;
  relevanceScore?: number;
}

export interface ToolExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed: number;
}

export interface MemorySystemStats {
  totalMemories: number;
  byContextType: Record<MemoryContextType, number>;
  averageImportance: number;
  oldestMemory?: string;
  newestMemory?: string;
}
