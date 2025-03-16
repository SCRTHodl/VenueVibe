import { supabase } from '../supabase';
import { 
  AgentMemory, 
  MemoryContextType, 
  MemorySearchResult,
  MemorySystemStats
} from './types';
import { TOKEN_ECONOMY } from '../tokenStore';

/**
 * Memory Manager for Agent Memory System
 * Handles creating, retrieving, updating and semantic search of agent memories
 */
export class MemoryManager {
  private userId: string;
  private maxMemories: number;

  constructor(userId: string, options?: { maxMemories?: number }) {
    this.userId = userId;
    this.maxMemories = options?.maxMemories || 100;
  }

  /**
   * Create a new memory
   */
  async createMemory(
    memory: Omit<AgentMemory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<AgentMemory | null> {
    try {
      // Check if we need to prune memories
      await this.pruneMemoriesIfNeeded();
      
      // Create the memory
      const { data, error } = await supabase
        .from('agent_system.agent_memories')
        .insert({
          user_id: this.userId,
          context_type: memory.contextType,
          content: memory.content,
          importance: memory.importance,
          expires_at: memory.expiresAt,
        })
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating memory:', error);
        return null;
      }
      
      // Convert from snake_case to camelCase
      return this.transformMemoryFromDB(data);
    } catch (error) {
      console.error('Unexpected error creating memory:', error);
      return null;
    }
  }

  /**
   * Retrieve memories by context type
   */
  async getMemoriesByContextType(
    contextType: MemoryContextType,
    limit: number = 10
  ): Promise<AgentMemory[]> {
    try {
      const { data, error } = await supabase
        .from('agent_system.agent_memories')
        .select('*')
        .eq('user_id', this.userId)
        .eq('context_type', contextType)
        .order('importance', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error retrieving memories:', error);
        return [];
      }
      
      return data.map(this.transformMemoryFromDB);
    } catch (error) {
      console.error('Unexpected error retrieving memories:', error);
      return [];
    }
  }

  /**
   * Search for memories using text similarity
   * This is a basic implementation - in production, you would use vector embeddings
   */
  async searchMemories(
    query: string,
    options?: {
      contextTypes?: MemoryContextType[];
      limit?: number;
      minImportance?: number;
    }
  ): Promise<MemorySearchResult[]> {
    try {
      // Simple text-based search for now
      // In a production app, this would use vector embeddings with a similarity search
      const { data, error } = await supabase
        .from('agent_system.agent_memories')
        .select('*')
        .eq('user_id', this.userId)
        .textSearch('content', query)
        .order('importance', { ascending: false });
      
      if (error) {
        console.error('Error searching memories:', error);
        return [];
      }
      
      // Filter by context type if provided
      let filtered = data;
      if (options?.contextTypes && options.contextTypes.length > 0) {
        filtered = data.filter(memory => 
          options.contextTypes?.includes(memory.context_type as MemoryContextType)
        );
      }
      
      // Filter by minimum importance
      if (options?.minImportance !== undefined) {
        filtered = filtered.filter(memory => 
          memory.importance >= (options.minImportance || 0)
        );
      }
      
      // Limit results
      const limited = filtered.slice(0, options?.limit || 10);
      
      // Transform and return with relevance scores
      // In a real implementation, these scores would come from vector similarity
      return limited.map(memory => ({
        memory: this.transformMemoryFromDB(memory),
        relevanceScore: 0.5 + (memory.importance / 20) // Simple mock score
      }));
    } catch (error) {
      console.error('Unexpected error searching memories:', error);
      return [];
    }
  }

  /**
   * Update memory importance
   */
  async updateMemoryImportance(
    memoryId: string,
    newImportance: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_system.agent_memories')
        .update({ importance: newImportance, updated_at: new Date().toISOString() })
        .eq('id', memoryId)
        .eq('user_id', this.userId);
      
      if (error) {
        console.error('Error updating memory importance:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Unexpected error updating memory importance:', error);
      return false;
    }
  }

  /**
   * Delete a memory
   */
  async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_system.agent_memories')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', this.userId);
      
      if (error) {
        console.error('Error deleting memory:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Unexpected error deleting memory:', error);
      return false;
    }
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats(): Promise<MemorySystemStats> {
    try {
      // Get total count
      const { count: totalMemories, error: countError } = await supabase
        .from('agent_system.agent_memories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId);
      
      if (countError) {
        console.error('Error getting memory count:', countError);
        return { totalMemories: 0, byContextType: {} as Record<MemoryContextType, number>, averageImportance: 0 };
      }
      
      // Get counts by context type
      const { data: contextTypeCounts, error: typeError } = await supabase
        .rpc('agent_system.get_memory_type_counts', { p_user_id: this.userId });
      
      // Get average importance
      const { data: avgData, error: avgError } = await supabase
        .from('agent_system.agent_memories')
        .select('importance')
        .eq('user_id', this.userId);
      
      // Calculate average importance
      const avgImportance = avgData && avgData.length > 0
        ? avgData.reduce((sum, item) => sum + item.importance, 0) / avgData.length
        : 0;
      
      // Get oldest and newest memories
      const { data: timeData, error: timeError } = await supabase
        .from('agent_system.agent_memories')
        .select('created_at')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: true });
      
      const oldestMemory = timeData && timeData.length > 0 ? timeData[0].created_at : undefined;
      const newestMemory = timeData && timeData.length > 0 ? timeData[timeData.length - 1].created_at : undefined;
      
      // Prepare context type counts
      const byContextType = {} as Record<MemoryContextType, number>;
      
      if (contextTypeCounts) {
        contextTypeCounts.forEach((item: any) => {
          byContextType[item.context_type as MemoryContextType] = item.count;
        });
      }
      
      return {
        totalMemories: totalMemories || 0,
        byContextType,
        averageImportance: avgImportance,
        oldestMemory,
        newestMemory
      };
    } catch (error) {
      console.error('Unexpected error getting memory stats:', error);
      return { 
        totalMemories: 0, 
        byContextType: {} as Record<MemoryContextType, number>, 
        averageImportance: 0 
      };
    }
  }

  /**
   * Prune low-importance memories if the user has too many
   */
  private async pruneMemoriesIfNeeded(): Promise<void> {
    try {
      const { count, error } = await supabase
        .from('agent_system.agent_memories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId);
      
      if (error) {
        console.error('Error checking memory count:', error);
        return;
      }
      
      if (count && count > this.maxMemories) {
        await supabase
          .rpc('agent_system.prune_low_importance_memories', {
            p_user_id: this.userId,
            p_max_memories: this.maxMemories
          });
      }
    } catch (error) {
      console.error('Unexpected error pruning memories:', error);
    }
  }

  /**
   * Transform memory from database format to application format
   */
  private transformMemoryFromDB(dbMemory: any): AgentMemory {
    return {
      id: dbMemory.id,
      userId: dbMemory.user_id,
      contextType: dbMemory.context_type as MemoryContextType,
      content: dbMemory.content,
      importance: dbMemory.importance,
      vectorEmbedding: dbMemory.vector_embedding,
      createdAt: dbMemory.created_at,
      updatedAt: dbMemory.updated_at,
      expiresAt: dbMemory.expires_at
    };
  }
}

// Helper function to calculate a suitable expiration date based on importance
export function calculateExpirationDate(importance: number): string | undefined {
  if (importance >= 8) {
    // Very important memories don't expire
    return undefined;
  }
  
  const now = new Date();
  
  switch (true) {
    case importance >= 6: // Important
      now.setFullYear(now.getFullYear() + 1);
      break;
    case importance >= 4: // Moderate
      now.setMonth(now.getMonth() + 3);
      break;
    case importance >= 2: // Low
      now.setMonth(now.getMonth() + 1);
      break;
    default: // Very low
      now.setDate(now.getDate() + 7);
      break;
  }
  
  return now.toISOString();
}
