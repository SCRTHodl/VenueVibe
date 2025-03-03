import React, { useState, useEffect } from 'react';
import { Brain, Plus, Search, Filter, X, Edit2, Trash2, Save, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface AIInstruction {
  id: string;
  inviteCode: string;
  name: string;
  description: string;
  instructions: {
    contentTypes: string[];
    tone: string;
    focus: string;
    prohibited: string[];
  };
  knowledgeBase: {
    [key: string]: string[];
  };
  contentFilters: {
    [key: string]: {
      keywords: string[];
      categories: string[];
      minScore: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export const AIInstructionsManager: React.FC = () => {
  const [instructions, setInstructions] = useState<AIInstruction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstruction, setSelectedInstruction] = useState<AIInstruction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch AI instructions
  useEffect(() => {
    const fetchInstructions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('ai_instructions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setInstructions(data || []);
      } catch (error) {
        console.error('Error fetching AI instructions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructions();
  }, []);

  // Filter instructions
  const filteredInstructions = instructions.filter(instruction => 
    !searchQuery || 
    instruction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instruction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Save instruction
  const handleSave = async () => {
    if (!selectedInstruction) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ai_instructions')
        .upsert({
          id: selectedInstruction.id,
          invite_code: selectedInstruction.inviteCode,
          name: selectedInstruction.name,
          description: selectedInstruction.description,
          instructions: selectedInstruction.instructions,
          knowledge_base: selectedInstruction.knowledgeBase,
          content_filters: selectedInstruction.contentFilters,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setInstructions(prev => prev.map(instruction => 
        instruction.id === selectedInstruction.id ? selectedInstruction : instruction
      ));

      setIsEditing(false);
      setSelectedInstruction(null);
    } catch (error) {
      console.error('Error saving instruction:', error);
      alert('Failed to save instruction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete instruction
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this instruction?')) return;

    try {
      const { error } = await supabase
        .from('ai_instructions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInstructions(prev => prev.filter(instruction => instruction.id !== id));
      setSelectedInstruction(null);
    } catch (error) {
      console.error('Error deleting instruction:', error);
      alert('Failed to delete instruction. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121826]">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="text-[--color-accent-primary]" />
            AI Instructions
          </h2>

          <button
            onClick={() => {
              setSelectedInstruction({
                id: crypto.randomUUID(),
                inviteCode: '',
                name: '',
                description: '',
                instructions: {
                  contentTypes: [],
                  tone: '',
                  focus: '',
                  prohibited: []
                },
                knowledgeBase: {},
                contentFilters: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
              setIsEditing(true);
            }}
            className="px-4 py-2 rounded-lg bg-[--color-accent-primary] text-white flex items-center gap-2"
          >
            <Plus size={18} />
            New Instruction
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search instructions..."
            className="w-full pl-10 pr-4 py-2 bg-[#1a2234] border border-gray-700 rounded-lg text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Instructions list */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-accent-primary]"></div>
          </div>
        ) : filteredInstructions.length > 0 ? (
          <div className="space-y-4">
            {filteredInstructions.map((instruction) => (
              <motion.div
                key={instruction.id}
                className="bg-[#1a2234] rounded-lg p-4 border border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">{instruction.name}</h3>
                    <p className="text-gray-400 text-sm mb-2">{instruction.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {instruction.instructions.contentTypes.map((type) => (
                        <span 
                          key={type}
                          className="px-2 py-0.5 rounded-full text-xs bg-[--color-accent-primary]/20 text-[--color-accent-primary]"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedInstruction(instruction);
                        setIsEditing(true);
                      }}
                      className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(instruction.id)}
                      className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain size={48} className="text-gray-500 mx-auto mb-3" />
            <h3 className="text-xl font-medium text-white mb-1">No instructions found</h3>
            <p className="text-gray-400">Create new AI instructions to get started</p>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <AnimatePresence>
        {selectedInstruction && isEditing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-2xl bg-[#1a2234] rounded-lg p-6 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className="text-xl font-bold text-white mb-6">
                {selectedInstruction.id ? 'Edit' : 'New'} AI Instruction
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={selectedInstruction.name}
                    onChange={(e) => setSelectedInstruction({
                      ...selectedInstruction,
                      name: e.target.value
                    })}
                    className="w-full bg-[#121826] border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Description</label>
                  <textarea
                    value={selectedInstruction.description}
                    onChange={(e) => setSelectedInstruction({
                      ...selectedInstruction,
                      description: e.target.value
                    })}
                    className="w-full bg-[#121826] border border-gray-600 rounded px-3 py-2 text-white h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Invite Code</label>
                  <input
                    type="text"
                    value={selectedInstruction.inviteCode}
                    onChange={(e) => setSelectedInstruction({
                      ...selectedInstruction,
                      inviteCode: e.target.value
                    })}
                    className="w-full bg-[#121826] border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Content Types</label>
                  <div className="space-y-2">
                    {['story', 'post', 'comment', 'venue'].map(type => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedInstruction.instructions.contentTypes.includes(type)}
                          onChange={(e) => {
                            const types = e.target.checked
                              ? [...selectedInstruction.instructions.contentTypes, type]
                              : selectedInstruction.instructions.contentTypes.filter(t => t !== type);
                            
                            setSelectedInstruction({
                              ...selectedInstruction,
                              instructions: {
                                ...selectedInstruction.instructions,
                                contentTypes: types
                              }
                            });
                          }}
                          className="form-checkbox h-4 w-4 text-[--color-accent-primary] rounded border-gray-600 bg-gray-700"
                        />
                        <span className="text-gray-300">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Tone</label>
                  <input
                    type="text"
                    value={selectedInstruction.instructions.tone}
                    onChange={(e) => setSelectedInstruction({
                      ...selectedInstruction,
                      instructions: {
                        ...selectedInstruction.instructions,
                        tone: e.target.value
                      }
                    })}
                    className="w-full bg-[#121826] border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Focus</label>
                  <input
                    type="text"
                    value={selectedInstruction.instructions.focus}
                    onChange={(e) => setSelectedInstruction({
                      ...selectedInstruction,
                      instructions: {
                        ...selectedInstruction.instructions,
                        focus: e.target.value
                      }
                    })}
                    className="w-full bg-[#121826] border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Prohibited Content</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedInstruction.instructions.prohibited.map((item, index) => (
                      <div 
                        key={index}
                        className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        <span>{item}</span>
                        <button
                          onClick={() => setSelectedInstruction({
                            ...selectedInstruction,
                            instructions: {
                              ...selectedInstruction.instructions,
                              prohibited: selectedInstruction.instructions.prohibited.filter((_, i) => i !== index)
                            }
                          })}
                          className="hover:text-red-200"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      placeholder="Add item..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value) {
                            setSelectedInstruction({
                              ...selectedInstruction,
                              instructions: {
                                ...selectedInstruction.instructions,
                                prohibited: [...selectedInstruction.instructions.prohibited, value]
                              }
                            });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className="bg-[#121826] border border-gray-600 rounded px-3 py-1 text-white text-sm min-w-[120px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedInstruction(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-[--color-accent-primary] hover:bg-[--color-accent-primary]/90 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};