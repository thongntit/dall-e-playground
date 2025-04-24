# GPT-Image-1 Model Integration Plan

## Overview

This document outlines the steps required to integrate OpenAI's new "gpt-image-1" model into the DALL-E Playground application. The implementation will build on the existing architecture while adding support for the new model's capabilities.

## Prerequisites

- Upgrade the OpenAI npm package to version 4.96.0 or later
- Understand the parameters supported by the "gpt-image-1" model from the OpenAI documentation

## Implementation Steps

### 1. Upgrade Dependencies

Update the OpenAI package in `package.json`:

```json
"dependencies": {
  "openai": "^4.96.0",
  // other dependencies...
}
```

Then run `npm install` or `pnpm install` to update the package.

### 2. Update Model Definitions

Modify the models array in `src/components/setting-form/index.tsx`:

```typescript
const models: Model[] = ['dall-e-3', 'dall-e-2', 'gpt-image-1']
```

### 3. Configure Model Parameters

Add configuration for the "gpt-image-1" model in the `configPerModel` object in `src/components/setting-form/index.tsx`:

```typescript
const configPerModel: Record<
  string,
  {
    noImages: NoImage[]
    sizes: Size[]
    qualities: Quality[]
    styles: Style[]
  }
> = {
  'dall-e-3': {
    // existing config...
  },
  'dall-e-2': {
    // existing config...
  },
  'gpt-image-1': {
    noImages: [1], // Assuming it supports only 1 image at a time
    sizes: ['1024x1024', '1792x1024', '1024x1792'], // These may need to be adjusted based on docs
    qualities: ['standard', 'hd'], // These may need to be adjusted based on docs
    styles: ['vivid', 'natural'], // These may need to be adjusted based on docs
  },
}
```

### 4. Update Type Definitions

If the new model introduces any new parameters, update the appropriate type definitions in `src/types/chat.ts` and `src/stores/config.ts`:

```typescript
// Example - if there are new parameters specific to gpt-image-1
export interface ImageMeta {
  quality?: Quality
  size?: Size
  style?: Style
  // Add any new parameters here
}
```

### 5. Implement API Integration

Update the image generation function in `src/stores/chat.ts`:

```typescript
const options: ImageGenerateParams = {
  prompt: enhancedPrompt,
  model: model || 'dall-e-3', // Default remains, but now can also be 'gpt-image-1'
  n: model === 'gpt-image-1' ? 1 : model === 'dall-e-3' ? 1 : noImage,
  response_format: 'b64_json',
  size: size || '1024x1024',
  style: style || 'vivid',
  quality: quality || 'standard',
  // Add any gpt-image-1 specific parameters here
};
```

### 6. Update UI Components

Modify the settings form to handle any gpt-image-1 specific UI elements:

```typescript
// Example - if gpt-image-1 has unique parameters
{someNewParameter?.length !== 0 && (
  <div>
    <label className="block py-2">New Parameter</label>
    <Select 
      value={someNewParameter} 
      onValueChange={(value) => setSomeNewParameter(value)}
    >
      {/* Select options */}
    </Select>
  </div>
)}
```

Update the message display component in `src/components/messages/index.tsx` to handle responses from the new model appropriately.

### 7. Testing Strategy

- Test model selection UI
- Test parameter configuration for the new model
- Test image generation with various prompts
- Test error handling
- Verify image display and metadata
- Compare results with DALL-E models to ensure quality

### 8. Potential Challenges

- API parameter compatibility
- Response format differences
- Error handling specific to the new model
- Performance considerations
- UI/UX adjustments for model-specific features

## References

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/images)
- [OpenAI Node.js SDK Documentation](https://github.com/openai/openai-node)