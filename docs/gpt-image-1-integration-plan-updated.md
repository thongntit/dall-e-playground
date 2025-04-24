# GPT-Image-1 Model Integration Plan (Updated)

## Overview

This document outlines the steps required to integrate OpenAI's new "gpt-image-1" model into the DALL-E Playground application. Based on analysis of the OpenAI SDK types, the gpt-image-1 model has several unique parameters and capabilities that will need to be incorporated into the application.

## Implementation Steps

### 1. Update Model Definitions

Modify the models array in `src/components/setting-form/index.tsx`:

```typescript
const models: Model[] = ['dall-e-3', 'dall-e-2', 'gpt-image-1']
```

### 2. Update Type Definitions

First, extend the existing types in `src/types/chat.ts` and `src/stores/config.ts` to include the new parameters:

```typescript
// src/stores/config.ts
export type Background = 'transparent' | 'opaque' | 'auto';
export type ContentModeration = 'low' | 'auto';
export type Format = 'png' | 'jpeg' | 'webp';
export type GptImageQuality = 'high' | 'medium' | 'low' | 'auto';

// Update the ConfigStore interface
type ConfigStore = {
  // Existing properties
  background: Background;
  setBackground: (background: Background) => void;
  
  contentModeration: ContentModeration;
  setContentModeration: (contentModeration: ContentModeration) => void;
  
  format: Format;
  setFormat: (format: Format) => void;
  
  compression: number;
  setCompression: (compression: number) => void;
  
  // Add other new properties as needed
}

// src/types/chat.ts
export interface ImageMeta {
  quality?: Quality | GptImageQuality;
  size?: Size;
  style?: Style;
  background?: Background;
  format?: Format;
  compression?: number;
  contentModeration?: ContentModeration;
}
```

### 3. Configure Model Parameters

Update the `configPerModel` object in `src/components/setting-form/index.tsx` with specific configurations for gpt-image-1:

```typescript
const configPerModel: Record<
  string,
  {
    noImages: NoImage[]
    sizes: Size[]
    qualities: any[] // Changed to any[] to accommodate different quality types
    styles: Style[]
    backgrounds?: Background[] // New property
    formats?: Format[] // New property
    contentModerationLevels?: ContentModeration[] // New property
    supportsCompression?: boolean // New property
  }
> = {
  'dall-e-3': {
    // Existing config
  },
  'dall-e-2': {
    // Existing config
  },
  'gpt-image-1': {
    noImages: [1], // Only supports 1 image at a time
    sizes: ['1024x1024', '1792x1024', '1024x1536', 'auto'],
    qualities: ['high', 'medium', 'low', 'auto'],
    styles: [], // No style parameter for gpt-image-1
    backgrounds: ['transparent', 'opaque', 'auto'],
    formats: ['png', 'jpeg', 'webp'],
    contentModerationLevels: ['low', 'auto'],
    supportsCompression: true
  }
}
```

### 4. Update the Config Store

Modify the DEFAULT_CONFIG in `src/stores/config.ts` to include default values for the new parameters:

```typescript
const DEFAULT_CONFIG: Pick<ConfigStore, 'model' | 'quality' | 'size' | 'style' | 'noImage' | 'background' | 'format' | 'contentModeration' | 'compression'> = {
  model: 'dall-e-3',
  quality: 'standard',
  style: 'vivid',
  size: '1024x1024',
  noImage: 1,
  background: 'auto',
  format: 'png',
  contentModeration: 'auto',
  compression: 100
}
```

Also add the setter functions for the new parameters:

```typescript
export const useConfigStore = create(
  persist<ConfigStore>(
    (set) => ({
      // Existing properties and functions
      
      background: 'auto',
      setBackground(background) {
        set({ background })
      },
      
      format: 'png',
      setFormat(format) {
        set({ format })
      },
      
      contentModeration: 'auto',
      setContentModeration(contentModeration) {
        set({ contentModeration })
      },
      
      compression: 100,
      setCompression(compression) {
        set({ compression })
      },
      
      // Make sure to update the reset function
      reset() {
        set({ ...DEFAULT_CONFIG })
      },
    }),
    {
      name: 'config-storage',
    },
  ),
)
```

### 5. Update the Settings Form UI

Add new UI controls for the gpt-image-1 specific parameters in `src/components/setting-form/index.tsx`:

```typescript
// Add to the existing destructuring
const {
  // Existing destructured values
  background,
  setBackground,
  format,
  setFormat,
  contentModeration,
  setContentModeration,
  compression,
  setCompression
} = useConfigStore()

// Then add UI elements for these new parameters
{model === 'gpt-image-1' && configPerModel[model]?.backgrounds?.length !== 0 && (
  <div>
    <label className="block py-2">Background</label>
    <Select value={background} onValueChange={(value) => setBackground(value as Background)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Background" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {configPerModel[model]?.backgrounds?.map((item) => (
            <SelectItem value={item} key={item}>
              {item.toUpperCase()}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
)}

// Similar UI components for format, contentModeration, etc.

// For compression, use a numeric input
{model === 'gpt-image-1' && configPerModel[model]?.supportsCompression && 
  (format === 'webp' || format === 'jpeg') && (
  <div>
    <label className="block py-2">Compression (0-100%)</label>
    <Input
      type="number"
      min={0}
      max={100}
      value={compression}
      onChange={(e) => setCompression(Number(e.target.value))}
    />
  </div>
)}
```

### 6. Update the Image Generation Function

Modify the image generation function in `src/stores/chat.ts` to handle the new parameters:

```typescript
const options: ImageGenerateParams = {
  prompt: enhancedPrompt,
  model: model || 'dall-e-3',
  n: model === 'gpt-image-1' ? 1 : model === 'dall-e-3' ? 1 : noImage,
  response_format: model === 'gpt-image-1' ? 'b64_json' : responseFormat || 'b64_json',
  size: size || '1024x1024',
};

// Add conditional parameters based on the selected model
if (model === 'dall-e-3') {
  options.style = style || 'vivid';
  options.quality = quality || 'standard';
} else if (model === 'gpt-image-1') {
  // Add gpt-image-1 specific parameters
  if (quality) options.quality = quality as any; // 'high', 'medium', 'low', or 'auto'
  if (background) options.background = background;
  if (format) options.format = format;
  if (contentModeration) options.content_moderation = contentModeration;
  if (format === 'webp' || format === 'jpeg') {
    options.compression = compression;
  }
}
```

### 7. Update the Message Display Component

Update the message display in `src/components/messages/index.tsx` to show the new parameters:

```typescript
<div className="text-xs text-gray-500">
  {message.model && `${message.model} • `}
  {message.imageMeta.size}
  {message.model === 'dall-e-3' && message.imageMeta.quality && ` • ${message.imageMeta.quality}`}
  {message.model === 'dall-e-3' && message.imageMeta.style && ` • ${message.imageMeta.style}`}
  {message.model === 'gpt-image-1' && message.imageMeta.quality && ` • quality: ${message.imageMeta.quality}`}
  {message.model === 'gpt-image-1' && message.imageMeta.format && ` • format: ${message.imageMeta.format}`}
  {message.model === 'gpt-image-1' && message.imageMeta.background && ` • background: ${message.imageMeta.background}`}
</div>
```

### 8. Update the Image Metadata Storage

When storing image metadata for gpt-image-1 generations, include the new parameters:

```typescript
const imageMeta: ImageMeta = {
  size: useConfigStore.getState().size || '1024x1024',
};

if (model === 'dall-e-3') {
  imageMeta.style = useConfigStore.getState().style || 'vivid';
  imageMeta.quality = useConfigStore.getState().quality || 'standard';
} else if (model === 'gpt-image-1') {
  imageMeta.quality = useConfigStore.getState().quality;
  imageMeta.background = useConfigStore.getState().background;
  imageMeta.format = useConfigStore.getState().format;
  imageMeta.contentModeration = useConfigStore.getState().contentModeration;
  if (useConfigStore.getState().format === 'webp' || useConfigStore.getState().format === 'jpeg') {
    imageMeta.compression = useConfigStore.getState().compression;
  }
}
```

### 9. Handle Token Usage Information

Update the response handling to capture and potentially display the token usage information that comes back with gpt-image-1:

```typescript
if (completion.usage && model === 'gpt-image-1') {
  console.log('Token usage:', completion.usage);
  // Optionally store or display this information
}
```

## Testing Strategy

1. Test model selection UI
2. Test parameter configuration for gpt-image-1:
   - Size options
   - Quality options
   - Background transparency
   - Format selection
   - Content moderation
   - Compression for webp/jpeg
3. Test image generation with various prompts
4. Verify proper display of metadata for generated images
5. Test error handling for invalid parameter combinations

## References

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/images)
- [gpt-image-1 Model Parameters](./gpt-image-1-model-parameters.md)