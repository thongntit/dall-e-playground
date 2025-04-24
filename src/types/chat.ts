import { ImageGenerateParams } from 'openai/resources'

type Defined<T> = T extends undefined ? never : T

// Common types
export type Quality = Defined<ImageGenerateParams['quality']>
export type Style = Defined<ImageGenerateParams['style']>
export type Size = Defined<ImageGenerateParams['size']>

// GPT-Image-1 specific types
export type Background = 'transparent' | 'opaque' | 'auto'
export type ContentModeration = 'low' | 'auto'
export type Format = 'png' | 'jpeg' | 'webp'
export type GptImageQuality = 'high' | 'medium' | 'low' | 'auto'

export interface Message {
  type: 'user' | 'assistant'
  content: string[]
  isError: boolean
  isLoading?: boolean
  imageMeta?: ImageMeta
  enhancedPrompt?: string // Store the enhanced version of the user's prompt
  timestamp: number
  model?: string | ''
}

export interface ImageMeta {
  quality?: Quality | GptImageQuality
  size?: Size
  style?: Style
  // GPT-Image-1 specific metadata
  background?: Background
  format?: Format
  compression?: number
  contentModeration?: ContentModeration
}

export interface ChatTopic {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}
