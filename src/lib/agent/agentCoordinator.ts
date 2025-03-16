import { MemoryManager } from './memoryManager';
import { ToolManager } from './toolManager';
import { BehaviorManager } from './behaviorManager';
import { AgentMemory, AgentBehavior, ToolExecutionResult } from './types';
import { supabase } from '../supabase';

/**
 * Agent Coordinator
 * Central coordination point for agent behaviors, memory, and tool execution.
 * Manages the agent's conversational state and handles routing to appropriate subsystems.
 */
export class AgentCoordinator {
  private userId: string;
  private userRole: 'admin' | 'premium' | 'basic';
  private memoryManager: MemoryManager;
  private toolManager: ToolManager;
  private behaviorManager: BehaviorManager;
  private currentBehavior: AgentBehavior | null = null;
  
  constructor(
    userId: string, 
    options: { 
      userRole?: 'admin' | 'premium' | 'basic';
      maxMemories?: number;
      behaviorId?: string;
    } = {}
  ) {
    this.userId = userId;
    this.userRole = options.userRole || 'basic';
    
    // Initialize subsystems
    this.memoryManager = new MemoryManager(userId, { 
      maxMemories: options.maxMemories || 100 
    });
    this.toolManager = new ToolManager(userId, this.userRole);
    this.behaviorManager = new BehaviorManager();
    
    // If behaviorId is provided, load it
    if (options.behaviorId) {
      this.loadBehavior(options.behaviorId);
    }
  }
  
  /**
   * Initialize the agent coordinator and all subsystems
   */
  async initialize(): Promise<boolean> {
    try {
      // Initialize the tool manager
      const toolsInitialized = await this.toolManager.initialize();
      if (!toolsInitialized) {
        console.error('Failed to initialize tool manager');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing agent coordinator:', error);
      return false;
    }
  }
  
  /**
   * Load a specific behavior for the agent
   */
  async loadBehavior(behaviorId: string): Promise<boolean> {
    try {
      const behavior = await this.behaviorManager.getBehaviorById(behaviorId);
      if (!behavior) {
        console.error(`Behavior with ID ${behaviorId} not found`);
        return false;
      }
      
      this.currentBehavior = behavior;
      return true;
    } catch (error) {
      console.error('Error loading behavior:', error);
      return false;
    }
  }
  
  /**
   * Load behavior by invite code
   */
  async loadBehaviorByInviteCode(inviteCode: string): Promise<boolean> {
    try {
      const behavior = await this.behaviorManager.getBehaviorByInviteCode(inviteCode);
      if (!behavior) {
        console.error(`No behavior found for invite code ${inviteCode}`);
        return false;
      }
      
      this.currentBehavior = behavior;
      return true;
    } catch (error) {
      console.error('Error loading behavior by invite code:', error);
      return false;
    }
  }
  
  /**
   * Create a memory
   */
  async createMemory(memory: Omit<AgentMemory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<AgentMemory | null> {
    return this.memoryManager.createMemory(memory);
  }
  
  /**
   * Search memories relevant to a query
   */
  async retrieveRelevantMemories(query: string): Promise<AgentMemory[]> {
    const results = await this.memoryManager.searchMemories(query, {
      limit: 5,
      minImportance: 3
    });
    
    return results.map(result => result.memory);
  }
  
  /**
   * Execute a tool
   */
  async executeTool<T = any>(
    toolName: string,
    params: Record<string, any>
  ): Promise<ToolExecutionResult<T>> {
    // Check if tool is allowed by current behavior
    if (
      this.currentBehavior && 
      this.currentBehavior.toolsAllowed && 
      !this.currentBehavior.toolsAllowed.includes(toolName)
    ) {
      return {
        success: false,
        error: `Tool '${toolName}' is not allowed by the current behavior`,
        tokensUsed: 0
      };
    }
    
    return this.toolManager.executeTool<T>(toolName, params);
  }
  
  /**
   * Process a user message
   * This function would integrate with an LLM service in a real implementation
   */
  async processUserMessage(
    message: string,
    conversationId: string
  ): Promise<{ response: string; memoryId?: string }> {
    try {
      // 1. Retrieve relevant memories
      const relevantMemories = await this.retrieveRelevantMemories(message);
      
      // 2. Construct a system prompt based on behavior
      let systemPrompt = 'You are a helpful AI assistant.';
      if (this.currentBehavior) {
        systemPrompt = this.currentBehavior.behaviorConfig.systemPrompt || systemPrompt;
      }
      
      // 3. Add memory context to the prompt
      if (relevantMemories.length > 0) {
        systemPrompt += '\n\nRelevant context from previous interactions:';
        for (const memory of relevantMemories) {
          systemPrompt += `\n- ${memory.content.text}`;
        }
      }
      
      // This would typically call an external LLM API
      // For now, we'll simulate a response
      console.log('Processing with system prompt:', systemPrompt);
      console.log('User message:', message);
      
      // Simulate response
      const response = `This is a simulated response to: "${message}". In a real implementation, this would come from an LLM service.`;
      
      // 4. Store the interaction as a memory
      const newMemory = await this.createMemory({
        contextType: 'conversation',
        content: {
          text: `User: ${message}\nAssistant: ${response}`,
          metadata: {
            conversationId,
            timestamp: new Date().toISOString()
          }
        },
        importance: 5, // Medium importance by default
      });
      
      return {
        response,
        memoryId: newMemory?.id
      };
    } catch (error) {
      console.error('Error processing user message:', error);
      return {
        response: 'I apologize, but I encountered an error processing your message. Please try again.'
      };
    }
  }
  
  /**
   * Get the agent's configuration
   */
  getAgentConfig(): {
    userId: string;
    userRole: string;
    currentBehavior: AgentBehavior | null;
  } {
    return {
      userId: this.userId,
      userRole: this.userRole,
      currentBehavior: this.currentBehavior
    };
  }
  
  /**
   * Clean up resources when the agent is no longer needed
   */
  async cleanup(): Promise<void> {
    // Nothing to clean up for now
    // In a real implementation, this might close connections, etc.
  }
}

// Create a singleton instance for easy access
let agentInstance: AgentCoordinator | null = null;

/**
 * Get or create the agent coordinator instance
 */
export async function getAgentCoordinator(): Promise<AgentCoordinator | null> {
  try {
    if (agentInstance) return agentInstance;
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }
    
    // Determine user role
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const { data: premiumUser } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    let userRole: 'admin' | 'premium' | 'basic' = 'basic';
    if (adminUser) {
      userRole = 'admin';
    } else if (premiumUser) {
      userRole = 'premium';
    }
    
    // Create agent coordinator
    agentInstance = new AgentCoordinator(user.id, { userRole });
    await agentInstance.initialize();
    
    return agentInstance;
  } catch (error) {
    console.error('Error creating agent coordinator:', error);
    return null;
  }
}

/**
 * Clear the agent coordinator instance
 */
export function clearAgentCoordinator(): void {
  agentInstance?.cleanup();
  agentInstance = null;
}
