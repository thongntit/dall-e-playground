# System Patterns

## State Management
- **Zustand Store Pattern**
  - Separate stores for chat and config
  - Persistent storage using zustand/middleware
  - Clear separation of concerns between stores

## Component Patterns
- **Layout Components**
  - DefaultLayout for main application structure
  - Imprint layout for image editing
- **UI Components**
  - Radix UI primitives for accessible components
  - Custom components built on primitives
  - Consistent styling with TailwindCSS

## Data Flow
- **Chat Messages**
  - Messages stored in chat store
  - Persistent storage via LocalForage
  - Real-time updates with state management
- **Image Generation**
  - Prompt enhancement pipeline
  - OpenAI API integration
  - Local image storage and retrieval

## Error Handling
- **API Error Management**
  - Error state in messages
  - User-friendly error displays
  - Graceful fallbacks
- **Image Processing**
  - Loading states for generation
  - Error handling for failed generations
  - Cancellation support

## Performance Patterns
- **Image Loading**
  - Lazy loading for images
  - Loading placeholders
  - Optimized storage and retrieval
- **State Updates**
  - Efficient state updates
  - Batched changes
  - Optimized re-renders

---

[2025-04-24 13:36] - Initial documentation of system patterns