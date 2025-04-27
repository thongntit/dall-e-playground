import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ImageGenerateParams } from 'openai/resources'
import { Background, ContentModeration, Format, GptImageQuality } from '../types/chat'

type Defined<T> = T extends undefined ? never : T

export type Model = Defined<ImageGenerateParams['model']>
export type Quality = Defined<ImageGenerateParams['quality']> | GptImageQuality
export type Style = Defined<ImageGenerateParams['style']>
export type Size = Defined<ImageGenerateParams['size']>
export type NoImage = Defined<ImageGenerateParams['n']>

type ConfigStore = {
  apiKey: string
  setAPIKey: (key: string) => void

  quality: Quality
  setQuality: (quality: Quality) => void

  style: Style
  setStyle: (style: Style) => void

  size: Size
  setSize: (style: Size) => void

  model: Model
  setModel: (model: Model) => void

  noImage: NoImage
  setNoImage: (noImage: NoImage) => void

  // GPT-Image-1 specific parameters
  background: Background
  setBackground: (background: Background) => void

  moderation: ContentModeration
  setModeration: (moderation: ContentModeration) => void

  outputCompression: number
  setOutputCompression: (compression: number) => void

  outputFormat: Format
  setOutputFormat: (format: Format) => void

  reset: () => void
}

const DEFAULT_CONFIG: Pick<
  ConfigStore,
  | 'model'
  | 'quality'
  | 'size'
  | 'style'
  | 'noImage'
  | 'background'
  | 'moderation'
  | 'outputCompression'
  | 'outputFormat'
> = {
  model: 'dall-e-3',
  quality: 'standard',
  style: 'vivid',
  size: '1024x1024',
  noImage: 1,
  background: 'auto',
  moderation: 'auto',
  outputCompression: 100,
  outputFormat: 'png',
}

export const useConfigStore = create(
  persist<ConfigStore>(
    (set) => ({
      ...DEFAULT_CONFIG,
      apiKey: '',
      setModel(model) {
        set({ model })
      },
      setAPIKey(key) {
        set({ apiKey: key })
      },
      setQuality(quality) {
        set({ quality })
      },
      setStyle(style) {
        set({ style })
      },
      setSize(size) {
        set({ size })
      },
      setNoImage(noImage) {
        set({ noImage })
      },
      setBackground(background) {
        set({ background })
      },

      setModeration(moderation) {
        set({ moderation })
      },

      setOutputCompression(compression) {
        set({ outputCompression: compression })
      },

      setOutputFormat(format) {
        set({ outputFormat: format })
      },

      reset() {
        set({ ...DEFAULT_CONFIG })
      },
    }),
    {
      name: 'config-storage',
    },
  ),
)
