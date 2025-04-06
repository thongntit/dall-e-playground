import { ImageGenerateParams } from 'openai/resources'

type Defined<T> = T extends undefined ? never : T

export type Quality = Defined<ImageGenerateParams['quality']>
export type Style = Defined<ImageGenerateParams['style']>
export type Size = Defined<ImageGenerateParams['size']>

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
  quality?: Quality
  size?: Size
  style?: Style
}

export interface ChatTopic {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}
