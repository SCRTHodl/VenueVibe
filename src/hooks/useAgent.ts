import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AgentCoordinator, 
  getAgentCoordinator, 
  clearAgentCoordinator 
} from '../lib/agent/agentCoordinator';
import { AgentMemory, AgentBehavior, ToolExecutionResult } from '../lib/agent/types';

interface UseAgentOptions {
  autoInitialize?: boolean;
  behaviorId?: string;
  inviteCode?: string;
}

interface UseAgentReturn {
  agent: AgentCoordinator | null;
  isInitializing: boolean;
  isReady: boolean;
  error: string | null;
  currentBehavior: AgentBehavior | null;
  
  // Memory operations
  createMemory: (memory: Omit<AgentMemory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<AgentMemory | null>;
  retrieveRelevantMemories: (query: string) => Promise<AgentMemory[]>;
  
  // Tool operations
  executeTool: <T = any>(toolName: string, params: Record<string, any>) => Promise<ToolExecutionResult<T>>;
  
  // Message processing
  processUserMessage: (message: string, conversationId: string) => Promise<{ response: string; memoryId?: string }>;
  
  // Behavior operations
  loadBehavior: (behaviorId: string) => Promise<boolean>;
  loadBehaviorByInviteCode: (inviteCode: string) => Promise<boolean>;
  
  // Cleanup
  cleanup: () => void;
}

/**
 * Hook for using the Agent system in React components
 */
export function useAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const [agent, setAgent] = useState<AgentCoordinator | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBehavior, setCurrentBehavior] = useState<AgentBehavior | null>(null);
  
  // Keep track of whether the component is mounted
  const isMounted = useRef(true);
  
  // Initialize the agent
  useEffect(() => {
    isMounted.current = true;
    
    const initAgent = async () => {
      if (!options.autoInitialize) return;
      
      setIsInitializing(true);
      setError(null);
      
      try {
        const agentInstance = await getAgentCoordinator();
        
        if (!agentInstance) {
          throw new Error('Failed to create agent coordinator');
        }
        
        // Initialize behavior if specified
        if (options.behaviorId) {
          const success = await agentInstance.loadBehavior(options.behaviorId);
          if (!success) {
            console.warn(`Failed to load behavior with ID ${options.behaviorId}`);
          }
        } else if (options.inviteCode) {
          const success = await agentInstance.loadBehaviorByInviteCode(options.inviteCode);
          if (!success) {
            console.warn(`Failed to load behavior for invite code ${options.inviteCode}`);
          }
        }
        
        // Update behavior state
        const config = agentInstance.getAgentConfig();
        
        if (isMounted.current) {
          setAgent(agentInstance);
          setCurrentBehavior(config.currentBehavior);
          setIsReady(true);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error('Error initializing agent:', err);
        if (isMounted.current) {
          setError(`Failed to initialize agent: ${err instanceof Error ? err.message : String(err)}`);
          setIsInitializing(false);
        }
      }
    };
    
    initAgent();
    
    return () => {
      isMounted.current = false;
    };
  }, [options.autoInitialize, options.behaviorId, options.inviteCode]);
  
  // Create memory wrapper
  const createMemory = useCallback(
    async (memory: Omit<AgentMemory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      if (!agent) return null;
      return agent.createMemory(memory);
    },
    [agent]
  );
  
  // Retrieve relevant memories wrapper
  const retrieveRelevantMemories = useCallback(
    async (query: string) => {
      if (!agent) return [];
      return agent.retrieveRelevantMemories(query);
    },
    [agent]
  );
  
  // Execute tool wrapper
  const executeTool = useCallback(
    async <T = any>(toolName: string, params: Record<string, any>) => {
      if (!agent) {
        return {
          success: false,
          error: 'Agent not initialized',
          tokensUsed: 0
        } as ToolExecutionResult<T>;
      }
      
      return agent.executeTool<T>(toolName, params);
    },
    [agent]
  );
  
  // Process user message wrapper
  const processUserMessage = useCallback(
    async (message: string, conversationId: string) => {
      if (!agent) {
        return {
          response: 'Agent not initialized. Please try again later.'
        };
      }
      
      return agent.processUserMessage(message, conversationId);
    },
    [agent]
  );
  
  // Load behavior wrapper
  const loadBehavior = useCallback(
    async (behaviorId: string) => {
      if (!agent) return false;
      
      const success = await agent.loadBehavior(behaviorId);
      if (success && isMounted.current) {
        const config = agent.getAgentConfig();
        setCurrentBehavior(config.currentBehavior);
      }
      
      return success;
    },
    [agent]
  );
  
  // Load behavior by invite code wrapper
  const loadBehaviorByInviteCode = useCallback(
    async (inviteCode: string) => {
      if (!agent) return false;
      
      const success = await agent.loadBehaviorByInviteCode(inviteCode);
      if (success && isMounted.current) {
        const config = agent.getAgentConfig();
        setCurrentBehavior(config.currentBehavior);
      }
      
      return success;
    },
    [agent]
  );
  
  // Cleanup function
  const cleanup = useCallback(() => {
    clearAgentCoordinator();
    if (isMounted.current) {
      setAgent(null);
      setIsReady(false);
      setCurrentBehavior(null);
    }
  }, []);
  
  return {
    agent,
    isInitializing,
    isReady,
    error,
    currentBehavior,
    createMemory,
    retrieveRelevantMemories,
    executeTool,
    processUserMessage,
    loadBehavior,
    loadBehaviorByInviteCode,
    cleanup
  };
}
