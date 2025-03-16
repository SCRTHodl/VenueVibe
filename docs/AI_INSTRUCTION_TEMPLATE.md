# Token Economy App - AI Instruction Template

## Project Context
- **Project Name**: Token Economy App
- **Purpose**: A social media platform with integrated token-based economy features for digital rewards, achievements, and transactions.
- **Current State**: In active development
- **Key Technologies**: 
  - Frontend: React, TypeScript, Next.js, TailwindCSS
  - Backend: Supabase (PostgreSQL)
  - Authentication: Supabase Auth
  - State Management: React Context API / Custom Hooks
  - Media: Browser Media API

## Architecture Overview
- **Database Schema**: 
  - Main app tables in default schema
  - Token economy tables in `token_economy` schema
- **API Layer**: 
  - Supabase client for database operations
  - Custom hooks for business logic abstraction
- **Component Structure**:
  - Reusable UI components in `/components`
  - Feature-specific components in subdirectories
  - Custom hooks in `/lib/hooks`

## Task Specification Template

### Feature/Fix Request
- **Feature Name**: [Descriptive name]
- **Priority Level**: [High/Medium/Low]
- **Related Features**: [List any interdependent features]
- **Affected Components**: [List files/components likely to be modified]

### Technical Requirements
- **Functional Requirements**:
  - [List specific behaviors needed]
- **Performance Requirements**:
  - [Specify any performance criteria]
- **Security Considerations**:
  - [Note any security requirements]
- **Compatibility**:
  - [Browser/device compatibility needs]

### Implementation Guidelines

#### Code Quality Standards
- Follow TypeScript best practices with proper typing
- Create interfaces for complex data structures
- Use React's functional components and hooks pattern
- Implement error boundaries where appropriate
- Add comprehensive error handling with user-friendly messages
- Include console logging with "[ComponentName]" prefixes for debugging
- Ensure proper cleanup of resources (especially camera/media streams)

#### Camera/Media Handling Specifics
- Use the singleton pattern via `useCamera` hook
- Implement proper stream initialization and cleanup
- Add timeouts/delays to prevent race conditions
- Include safe playback functions with error recovery
- Handle visibility changes correctly for camera pause/resume

#### Database Operations
- Use Supabase type-safe queries where possible
- Implement optimistic updates for better UX
- Use appropriate error handling for database operations
- Respect the schema separation between main app and token economy

#### State Management
- Use React Context for global state when needed
- Prefer local component state for component-specific data
- Implement proper state initialization and cleanup
- Avoid prop drilling by using custom hooks

#### Agent Memory System
- Use the `MemoryManager` for persistent memory operations
- Respect memory importance levels (1-10) for proper retention
- Use appropriate context types for better organization
- Implement proper error handling for memory operations
- Include memory clean-up functions for proper resource management
- Use the `useAgent` hook for React component integration

### Testing Criteria
- **Expected Behavior**: [Describe what success looks like]
- **Edge Cases**: [List potential edge cases to handle]
- **Testing Steps**: [Specific steps to validate implementation]

### Documentation Requirements
- Document complex logic with inline comments
- Update relevant documentation files if applicable
- Add JSDoc comments for public APIs/hooks
- Note any new environment variables needed

## Implementation Notes
- When implementing UI changes, maintain the existing design language
- For media features, ensure compatibility across major browsers
- Consider mobile responsiveness in all UI implementations
- Apply appropriate debouncing/throttling for expensive operations
- Add appropriate logging for debugging and diagnostics
- Implement proper loading states for async operations

## Token Economy Specific Guidelines
- All token economy functions should exist in the `token_economy` schema
- Follow the existing token economy data models (refer to TOKEN_ECONOMY_SCHEMA.md)
- Implement proper transaction handling for token operations
- Include validation for token-related operations
- Consider rate limiting for token-generating actions

## Agent Memory System Guidelines

### Memory Management
- All agent memory operations should use the `agent_system` schema
- Follow the importance level guidelines for memory retention:
  - 9-10: Critical user preferences that should never expire
  - 7-8: Important long-term preferences (theme, language)
  - 5-6: Medium-term context (ongoing projects)
  - 3-4: Short-term information (recent discussions)
  - 1-2: Temporary context (current session only)
- Use appropriate context types for better search results
- Add metadata for richer context when relevant
- Handle memory privacy according to user settings

### Tool Management
- Register tools with appropriate permissions and token costs
- Implement rate limiting for computationally expensive tools
- Track tool usage for analytics and optimization
- Validate inputs before execution for security
- Handle errors gracefully and provide helpful messages

### Behavior Management
- Create behaviors with clear personality and response guidelines
- Link behaviors to invite codes when appropriate
- Configure memory retention based on user tier
- Set up proper tool access controls by behavior
- Consider performance and token usage when designing behaviors

---

## How to Use This Template

1. Copy this template when requesting new features or fixes
2. Fill in the relevant sections based on your specific needs
3. Remove any sections that aren't applicable to your request
4. Be specific about expected outcomes and acceptance criteria
5. Include references to existing code when relevant
6. For complex features, break down into multiple smaller requests

By using this structured approach, you'll receive more focused, high-quality solutions that align with your project architecture while minimizing token usage.
