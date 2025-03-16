import { supabase } from '../supabase';
import { 
  AgentTool, 
  ToolUsageHistory, 
  ToolExecutionResult,
  ToolType
} from './types';
import { useTokenStore } from '../tokenStore';

/**
 * Tool Manager for Agent System
 * Handles retrieving available tools and executing tool operations
 */
export class ToolManager {
  private userId: string;
  private userRole: 'admin' | 'premium' | 'basic';
  private availableTools: AgentTool[] = [];
  private toolRegistry: Record<string, ToolExecutor> = {};

  constructor(userId: string, userRole: 'admin' | 'premium' | 'basic' = 'basic') {
    this.userId = userId;
    this.userRole = userRole;
    this.registerBuiltinTools();
  }

  /**
   * Initialize the tool manager by loading available tools
   */
  async initialize(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('agent_system.agent_tools')
        .select('*');
        
      if (error) {
        console.error('Error loading tools:', error);
        return false;
      }
      
      this.availableTools = data.map(this.transformToolFromDB);
      return true;
    } catch (error) {
      console.error('Unexpected error initializing tool manager:', error);
      return false;
    }
  }

  /**
   * Get all tools available to the user
   */
  getAvailableTools(): AgentTool[] {
    return this.availableTools.filter(tool => {
      if (this.userRole === 'admin') return tool.permissions.admin;
      if (this.userRole === 'premium') return tool.permissions.premium;
      return tool.permissions.basic;
    });
  }

  /**
   * Execute a tool by name
   */
  async executeTool<T = any>(
    toolName: string, 
    params: Record<string, any>
  ): Promise<ToolExecutionResult<T>> {
    try {
      // Find the tool
      const tool = this.availableTools.find(t => t.name === toolName);
      if (!tool) {
        return {
          success: false,
          error: `Tool '${toolName}' not found`,
          tokensUsed: 0
        };
      }
      
      // Check if user has permission to use this tool
      const hasPermission = 
        (this.userRole === 'admin' && tool.permissions.admin) ||
        (this.userRole === 'premium' && tool.permissions.premium) ||
        (this.userRole === 'basic' && tool.permissions.basic);
        
      if (!hasPermission) {
        return {
          success: false,
          error: `No permission to use tool '${toolName}'`,
          tokensUsed: 0
        };
      }
      
      // Check if user has enough tokens
      const tokenStore = useTokenStore.getState();
      if (tokenStore.balance < tool.tokenCost) {
        return {
          success: false,
          error: `Insufficient tokens to use tool '${toolName}'`,
          tokensUsed: 0
        };
      }
      
      // Check rate limiting
      if (tool.rateLimit) {
        const isRateLimited = await this.checkRateLimit(tool.id!, tool.rateLimit);
        if (isRateLimited) {
          return {
            success: false,
            error: `Rate limit exceeded for tool '${toolName}'`,
            tokensUsed: 0
          };
        }
      }
      
      // Execute the tool
      const executor = this.toolRegistry[toolName];
      if (!executor) {
        return {
          success: false,
          error: `No executor registered for tool '${toolName}'`,
          tokensUsed: 0
        };
      }
      
      // Spend the tokens
      const spentTokens = await tokenStore.spendTokens(
        tool.tokenCost,
        `Used AI tool: ${toolName}`,
        tool.id
      );
      
      if (!spentTokens) {
        return {
          success: false,
          error: 'Failed to spend tokens',
          tokensUsed: 0
        };
      }
      
      try {
        // Execute the tool
        const result = await executor(params);
        
        // Record the tool usage
        await this.recordToolUsage({
          userId: this.userId,
          toolId: tool.id!,
          tokensSpent: tool.tokenCost,
          success: true,
          requestData: params,
          resultSummary: typeof result === 'object' 
            ? JSON.stringify(result).substring(0, 255) 
            : String(result).substring(0, 255)
        });
        
        return {
          success: true,
          data: result as T,
          tokensUsed: tool.tokenCost
        };
      } catch (error) {
        // Record the failed tool usage
        await this.recordToolUsage({
          userId: this.userId,
          toolId: tool.id!,
          tokensSpent: tool.tokenCost,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          requestData: params
        });
        
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          tokensUsed: tool.tokenCost
        };
      }
    } catch (error) {
      console.error('Unexpected error executing tool:', error);
      return {
        success: false,
        error: 'Unexpected error executing tool',
        tokensUsed: 0
      };
    }
  }

  /**
   * Register a custom tool executor
   */
  registerToolExecutor(toolName: string, executor: ToolExecutor): void {
    this.toolRegistry[toolName] = executor;
  }

  /**
   * Record tool usage for analytics and rate limiting
   */
  private async recordToolUsage(usage: Omit<ToolUsageHistory, 'id' | 'createdAt'>): Promise<void> {
    try {
      await supabase
        .from('agent_system.tool_usage_history')
        .insert({
          user_id: usage.userId,
          tool_id: usage.toolId,
          tokens_spent: usage.tokensSpent,
          success: usage.success,
          error_message: usage.errorMessage,
          request_data: usage.requestData,
          result_summary: usage.resultSummary
        });
    } catch (error) {
      console.error('Error recording tool usage:', error);
    }
  }

  /**
   * Check if a tool is rate limited for the current user
   */
  private async checkRateLimit(
    toolId: string,
    rateLimit: { maxRequests: number; timeWindow: number }
  ): Promise<boolean> {
    try {
      const timeWindow = new Date();
      timeWindow.setSeconds(timeWindow.getSeconds() - rateLimit.timeWindow);
      
      const { count, error } = await supabase
        .from('agent_system.tool_usage_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('tool_id', toolId)
        .gte('created_at', timeWindow.toISOString());
      
      if (error) {
        console.error('Error checking rate limit:', error);
        return false; // Allow the operation if we can't check
      }
      
      return count !== null && count >= rateLimit.maxRequests;
    } catch (error) {
      console.error('Unexpected error checking rate limit:', error);
      return false; // Allow the operation if we can't check
    }
  }

  /**
   * Register built-in tool executors
   */
  private registerBuiltinTools(): void {
    // Web search tool
    this.registerToolExecutor('web_search', async (params: { query: string }) => {
      // Simplified implementation - this would integrate with a real search API
      console.log(`Searching the web for: ${params.query}`);
      return {
        results: [
          { title: 'Example result 1', snippet: 'This is a sample search result' },
          { title: 'Example result 2', snippet: 'Another sample result' }
        ]
      };
    });
    
    // Database query tool
    this.registerToolExecutor('database_query', async (params: { 
      table: string; 
      filter?: Record<string, any>;
      limit?: number;
    }) => {
      try {
        const { data, error } = await supabase
          .from(params.table)
          .select('*')
          .limit(params.limit || 10);
          
        if (error) throw new Error(error.message);
        return data;
      } catch (error) {
        console.error('Error in database_query tool:', error);
        throw error;
      }
    });
    
    // Summarization tool
    this.registerToolExecutor('summarization', async (params: { text: string }) => {
      // This would integrate with an AI service for summarization
      return {
        summary: `Summary of ${params.text.length} characters of text`,
        keyPoints: ['Sample key point 1', 'Sample key point 2']
      };
    });
  }

  /**
   * Transform tool from database format to application format
   */
  private transformToolFromDB(dbTool: any): AgentTool {
    return {
      id: dbTool.id,
      name: dbTool.name,
      description: dbTool.description,
      toolType: dbTool.tool_type as ToolType,
      permissions: dbTool.permissions,
      tokenCost: dbTool.token_cost,
      rateLimit: dbTool.rate_limit,
      createdAt: dbTool.created_at,
      updatedAt: dbTool.updated_at
    };
  }
}

// Type for tool executor functions
type ToolExecutor = (params: Record<string, any>) => Promise<any>;
