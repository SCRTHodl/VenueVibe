import { supabase } from '../supabase';
import { AgentBehavior } from './types';

/**
 * Behavior Manager for Agent System
 * Handles retrieving and managing agent behaviors
 */
export class BehaviorManager {
  private cachedBehaviors: AgentBehavior[] = [];

  /**
   * Load all available behaviors
   */
  async loadBehaviors(): Promise<AgentBehavior[]> {
    try {
      const { data, error } = await supabase
        .from('agent_system.agent_behaviors')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading behaviors:', error);
        return [];
      }
      
      this.cachedBehaviors = data.map(this.transformBehaviorFromDB);
      return this.cachedBehaviors;
    } catch (error) {
      console.error('Unexpected error loading behaviors:', error);
      return [];
    }
  }

  /**
   * Get a behavior by ID
   */
  async getBehaviorById(id: string): Promise<AgentBehavior | null> {
    // Check cache first
    const cached = this.cachedBehaviors.find(behavior => behavior.id === id);
    if (cached) return cached;
    
    try {
      const { data, error } = await supabase
        .from('agent_system.agent_behaviors')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error getting behavior:', error);
        return null;
      }
      
      return this.transformBehaviorFromDB(data);
    } catch (error) {
      console.error('Unexpected error getting behavior:', error);
      return null;
    }
  }

  /**
   * Get a behavior by invite code
   */
  async getBehaviorByInviteCode(inviteCode: string): Promise<AgentBehavior | null> {
    try {
      // First get the invite code ID
      const { data: inviteData, error: inviteError } = await supabase
        .from('invite_codes')
        .select('id')
        .eq('code', inviteCode)
        .single();
      
      if (inviteError || !inviteData) {
        console.error('Error getting invite code:', inviteError);
        return null;
      }
      
      // Then get the behavior
      const { data, error } = await supabase
        .from('agent_system.agent_behaviors')
        .select('*')
        .eq('invite_code_id', inviteData.id)
        .single();
      
      if (error) {
        console.error('Error getting behavior:', error);
        return null;
      }
      
      return this.transformBehaviorFromDB(data);
    } catch (error) {
      console.error('Unexpected error getting behavior by invite code:', error);
      return null;
    }
  }

  /**
   * Create a new behavior
   */
  async createBehavior(
    behavior: Omit<AgentBehavior, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<AgentBehavior | null> {
    try {
      const { data, error } = await supabase
        .from('agent_system.agent_behaviors')
        .insert({
          name: behavior.name,
          description: behavior.description,
          invite_code_id: behavior.inviteCodeId,
          behavior_config: behavior.behaviorConfig,
          tools_allowed: behavior.toolsAllowed,
          memory_config: behavior.memoryConfig,
          created_by: userId
        })
        .select('*')
        .single();
      
      if (error) {
        console.error('Error creating behavior:', error);
        return null;
      }
      
      const newBehavior = this.transformBehaviorFromDB(data);
      this.cachedBehaviors.push(newBehavior);
      return newBehavior;
    } catch (error) {
      console.error('Unexpected error creating behavior:', error);
      return null;
    }
  }

  /**
   * Update an existing behavior
   */
  async updateBehavior(
    id: string,
    updates: Partial<Omit<AgentBehavior, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>
  ): Promise<boolean> {
    try {
      const updateData: Record<string, any> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.inviteCodeId !== undefined) updateData.invite_code_id = updates.inviteCodeId;
      if (updates.behaviorConfig !== undefined) updateData.behavior_config = updates.behaviorConfig;
      if (updates.toolsAllowed !== undefined) updateData.tools_allowed = updates.toolsAllowed;
      if (updates.memoryConfig !== undefined) updateData.memory_config = updates.memoryConfig;
      
      updateData.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('agent_system.agent_behaviors')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating behavior:', error);
        return false;
      }
      
      // Update cache
      const index = this.cachedBehaviors.findIndex(behavior => behavior.id === id);
      if (index !== -1) {
        this.cachedBehaviors[index] = {
          ...this.cachedBehaviors[index],
          ...updates,
          updatedAt: updateData.updated_at
        };
      }
      
      return true;
    } catch (error) {
      console.error('Unexpected error updating behavior:', error);
      return false;
    }
  }

  /**
   * Delete a behavior
   */
  async deleteBehavior(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_system.agent_behaviors')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting behavior:', error);
        return false;
      }
      
      // Update cache
      this.cachedBehaviors = this.cachedBehaviors.filter(behavior => behavior.id !== id);
      
      return true;
    } catch (error) {
      console.error('Unexpected error deleting behavior:', error);
      return false;
    }
  }

  /**
   * Transform behavior from database format to application format
   */
  private transformBehaviorFromDB(dbBehavior: any): AgentBehavior {
    return {
      id: dbBehavior.id,
      name: dbBehavior.name,
      description: dbBehavior.description,
      inviteCodeId: dbBehavior.invite_code_id,
      behaviorConfig: dbBehavior.behavior_config,
      toolsAllowed: dbBehavior.tools_allowed,
      memoryConfig: dbBehavior.memory_config,
      createdAt: dbBehavior.created_at,
      updatedAt: dbBehavior.updated_at,
      createdBy: dbBehavior.created_by
    };
  }
}

// Helper to generate a default system prompt based on behavior parameters
export function generateSystemPrompt(params: {
  primaryGoal?: string;
  personality?: string;
  responseStyle?: string;
  priorityTopics?: string[];
  avoidanceTopics?: string[];
}): string {
  const { 
    primaryGoal = 'assist the user with their requests', 
    personality = 'helpful, friendly, and knowledgeable', 
    responseStyle = 'conversational yet concise',
    priorityTopics = [],
    avoidanceTopics = []
  } = params;

  let prompt = `You are an intelligent AI assistant that is ${personality}. `;
  prompt += `Your primary goal is to ${primaryGoal}. `;
  prompt += `Your responses should be ${responseStyle}. `;
  
  if (priorityTopics.length > 0) {
    prompt += `You should prioritize discussions about: ${priorityTopics.join(', ')}. `;
  }
  
  if (avoidanceTopics.length > 0) {
    prompt += `Avoid discussing: ${avoidanceTopics.join(', ')}. `;
  }
  
  return prompt;
}
