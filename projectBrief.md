# DALL-E Playground - Project Brief

## Project Overview
DALL-E Playground is an unofficial web application that provides a user-friendly interface for interacting with OpenAI's image generation APIs. The application supports both DALL-E 2 and DALL-E 3 models, allowing users to generate, modify, and manipulate AI-created images through natural language prompts.

## Key Features
- **Dual Model Support**: Compatible with both DALL-E 2 and DALL-E 3 models
- **Multi-variant Generation**: Create multiple variations of images (DALL-E 2 only)
- **Conversational Interface**: Chat-based interface for image generation
- **Persistent Storage**: Local storage of generated images and chat history
- **Imprinting Image**: Add images to prompts for context (MVP implemented)
- **Responsive Design**: Mobile and desktop-friendly interface
- **Error Handling**: Robust error management and feedback
- **Generation Control**: Ability to cancel ongoing image generations

## Technical Stack
- **Frontend Framework**: React 18
- **Styling**: TailwindCSS with custom components
- **State Management**: Zustand
- **Routing**: React Router
- **API Integration**: OpenAI API
- **Build Tool**: Vite
- **Language**: TypeScript
- **Data Persistence**: LocalForage
- **UI Components**: Radix UI primitives

## Project Structure
- **src/components/**: UI components including input box, messages, and settings
- **src/pages/**: Route-based page components
- **src/stores/**: Zustand state management stores
- **src/hooks/**: Custom React hooks
- **src/lib/**: Utility functions and helpers
- **src/types/**: TypeScript type definitions
- **src/assets/**: Static assets including icons

## Development
The project uses modern web development practices:
- TypeScript for type safety
- ESLint and StyleLint for code quality
- Husky for git hooks
- Conventional commits
- React Query for API state management

## Planned Features
- Outpainting image functionality (extending images beyond their borders)
- Additional customization options for generated images
- Enhanced chat history and prompt management

## Deployment
The application is deployed on Vercel with a live preview available at [https://dalleplayground.vercel.app/](https://dalleplayground.vercel.app/)

## Source
The project was forked from [Quilljou DALL·E 3 Playground](https://github.com/Quilljou/dalle3-playground) and enhanced with additional features including image imprinting capability.

---

*This project requires users to provide their own [OpenAI API Key](https://platform.openai.com/account/api-keys)*