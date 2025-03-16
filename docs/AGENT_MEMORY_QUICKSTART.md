# Agent Memory System Quick Start Guide

This guide provides a quick introduction to using the Agent Memory System in your components and features.

## Installation

The Agent Memory System is already integrated with the application. No additional installation is required.

## Basic Usage

### Initializing the Agent

```tsx
import { useAgent } from '../hooks/useAgent';

function MyComponent() {
  const { 
    agent,
    isReady,
    isInitializing,
    error,
    currentBehavior
  } = useAgent({
    autoInitialize: true,
    // Optional: specify a behavior ID or invite code
    // behaviorId: 'behavior-uuid',
    // inviteCode: 'PREMIUM123'
  });

  if (isInitializing) return <div>Initializing AI...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!isReady) return <div>AI not ready</div>;

  return (
    <div>
      <h2>AI Assistant</h2>
      {currentBehavior && (
        <div>Personality: {currentBehavior.name}</div>
      )}
      {/* Your component content */}
    </div>
  );
}
```

### Processing User Messages

```tsx
import { useAgent } from '../hooks/useAgent';
import { useState } from 'react';

function ChatInterface() {
  const [messages, setMessages] = useState<{ user: boolean; text: string }[]>([]);
  const [input, setInput] = useState('');
  const { processUserMessage, isReady } = useAgent({ autoInitialize: true });

  const handleSendMessage = async () => {
    if (!input.trim() || !isReady) return;

    // Add user message to the chat
    setMessages(prev => [...prev, { user: true, text: input }]);
    const userMessage = input;
    setInput('');

    // Process with the agent
    try {
      const { response } = await processUserMessage(
        userMessage, 
        'conversation-123'  // Unique conversation ID
      );

      // Add AI response to the chat
      setMessages(prev => [...prev, { user: false, text: response }]);
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, { 
        user: false, 
        text: 'Sorry, I encountered an error processing your message.' 
      }]);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.user ? 'user-message' : 'ai-message'}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage} disabled={!isReady}>Send</button>
      </div>
    </div>
  );
}
```

### Working with Memories

```tsx
import { useAgent } from '../hooks/useAgent';
import { useState } from 'react';
import { AgentMemory, MemoryContextType } from '../lib/agent/types';

function MemoryManager() {
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { createMemory, retrieveRelevantMemories, isReady } = useAgent({ autoInitialize: true });

  // Create a new memory
  const handleCreateMemory = async (text: string, contextType: MemoryContextType, importance: number) => {
    if (!isReady) return;
    
    const memory = await createMemory({
      contextType,
      content: { text },
      importance,
    });
    
    if (memory) {
      alert('Memory created successfully!');
    }
  };

  // Search for memories
  const handleSearchMemories = async () => {
    if (!searchQuery.trim() || !isReady) return;
    
    const results = await retrieveRelevantMemories(searchQuery);
    setMemories(results);
  };

  return (
    <div className="memory-manager">
      <h2>Memory Manager</h2>
      
      <div className="create-memory">
        <h3>Create Memory</h3>
        <textarea placeholder="Memory content" id="memory-text"></textarea>
        <select id="context-type">
          <option value="conversation">Conversation</option>
          <option value="preference">Preference</option>
          <option value="profile">Profile</option>
          <option value="task">Task</option>
        </select>
        <select id="importance">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <button onClick={() => {
          const text = (document.getElementById('memory-text') as HTMLTextAreaElement).value;
          const contextType = (document.getElementById('context-type') as HTMLSelectElement).value as MemoryContextType;
          const importance = parseInt((document.getElementById('importance') as HTMLSelectElement).value);
          handleCreateMemory(text, contextType, importance);
        }}>Create Memory</button>
      </div>
      
      <div className="search-memories">
        <h3>Search Memories</h3>
        <input 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search query"
          onKeyPress={(e) => e.key === 'Enter' && handleSearchMemories()}
        />
        <button onClick={handleSearchMemories}>Search</button>
        
        <div className="memory-results">
          {memories.map((memory, i) => (
            <div key={i} className="memory-item">
              <div className="memory-header">
                <span className="memory-type">{memory.contextType}</span>
                <span className="memory-importance">Importance: {memory.importance}</span>
              </div>
              <div className="memory-content">{memory.content.text}</div>
              <div className="memory-date">
                Created: {new Date(memory.createdAt!).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Using AI Tools

```tsx
import { useAgent } from '../hooks/useAgent';
import { useState } from 'react';

function ToolExamples() {
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { executeTool, isReady } = useAgent({ autoInitialize: true });

  // Execute a web search tool
  const handleWebSearch = async () => {
    if (!searchQuery.trim() || !isReady) return;
    
    setIsLoading(true);
    try {
      const result = await executeTool('web_search', { query: searchQuery });
      
      if (result.success) {
        setSearchResults(result.data);
      } else {
        console.error('Search failed:', result.error);
        alert(`Search failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error executing tool:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tool-examples">
      <h2>AI Tool Examples</h2>
      
      <div className="web-search">
        <h3>Web Search</h3>
        <input 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search query"
          onKeyPress={(e) => e.key === 'Enter' && handleWebSearch()}
        />
        <button onClick={handleWebSearch} disabled={isLoading || !isReady}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        
        {searchResults && (
          <div className="search-results">
            <h4>Search Results</h4>
            {searchResults.results.map((result: any, i: number) => (
              <div key={i} className="result-item">
                <h5>{result.title}</h5>
                <p>{result.snippet}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Advanced Features

### Loading Custom Behaviors

```tsx
import { useAgent } from '../hooks/useAgent';
import { useState, useEffect } from 'react';
import { AgentBehavior } from '../lib/agent/types';

function BehaviorSelector() {
  const [behaviors, setBehaviors] = useState<AgentBehavior[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const { 
    loadBehavior, 
    loadBehaviorByInviteCode, 
    currentBehavior, 
    isReady 
  } = useAgent({ autoInitialize: true });

  // Load behaviors from database (requires an API endpoint)
  useEffect(() => {
    if (!isReady) return;
    
    async function loadBehaviors() {
      const response = await fetch('/api/agent-behaviors');
      const data = await response.json();
      setBehaviors(data);
    }
    
    loadBehaviors();
  }, [isReady]);

  // Apply a behavior by ID
  const handleSelectBehavior = async (behaviorId: string) => {
    if (!isReady) return;
    
    const success = await loadBehavior(behaviorId);
    if (success) {
      alert('Behavior applied successfully!');
    } else {
      alert('Failed to apply behavior.');
    }
  };

  // Apply a behavior by invite code
  const handleApplyInviteCode = async () => {
    if (!inviteCode.trim() || !isReady) return;
    
    const success = await loadBehaviorByInviteCode(inviteCode);
    if (success) {
      alert('Invite code applied successfully!');
      setInviteCode('');
    } else {
      alert('Invalid invite code or error applying behavior.');
    }
  };

  return (
    <div className="behavior-selector">
      <h2>AI Personality Selector</h2>
      
      {currentBehavior && (
        <div className="current-behavior">
          <h3>Current Personality: {currentBehavior.name}</h3>
          <p>{currentBehavior.description}</p>
        </div>
      )}
      
      <div className="invite-code">
        <h3>Apply Invite Code</h3>
        <input 
          value={inviteCode} 
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Enter invite code"
          onKeyPress={(e) => e.key === 'Enter' && handleApplyInviteCode()}
        />
        <button onClick={handleApplyInviteCode}>Apply</button>
      </div>
      
      <div className="behavior-list">
        <h3>Available Personalities</h3>
        {behaviors.map((behavior) => (
          <div key={behavior.id} className="behavior-item">
            <h4>{behavior.name}</h4>
            <p>{behavior.description}</p>
            <button onClick={() => handleSelectBehavior(behavior.id!)}>
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

1. **Initialize Early**: Use `autoInitialize: true` to set up the agent as soon as possible
2. **Handle States**: Always check `isReady` before executing agent functions
3. **Error Handling**: Implement proper error handling for all agent operations
4. **Memory Importance**: Use the right importance levels (1-10) based on data criticality
5. **Memory Content**: Structure memory content with useful metadata
6. **Tool Usage**: Be mindful of token costs when executing tools
7. **Conversation IDs**: Use consistent conversation IDs for related messages
8. **Cleanup**: Call `cleanup()` function when components unmount

## Common Issues & Solutions

1. **Agent Not Initializing**
   - Check user authentication status
   - Verify Supabase connection
   - Look for console errors

2. **Memory Not Found**
   - Use proper context types
   - Set sufficient importance level
   - Check if memory has expired

3. **Tool Execution Failed**
   - Verify user has permission
   - Check token balance
   - Review rate limiting settings
   - Validate input parameters

4. **Behavior Not Loading**
   - Confirm invite code is valid
   - Check that behavior exists
   - Verify database references

## Further Resources

- Full API documentation in `AGENT_MEMORY_SYSTEM.md`
- Database schema details in migration file
- Example components in `/examples` directory
- Admin configuration in `ADMIN_GUIDE.md`
