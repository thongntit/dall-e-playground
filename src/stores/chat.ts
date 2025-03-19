import { OpenAI } from 'openai'
import { ImageGenerateParams, ImageEditParams } from 'openai/resources'
import { imageStore } from 'src/lib/image-persist'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useConfigStore } from './config'

export type ImageMeta = Pick<ImageGenerateParams, 'quality' | 'size' | 'style'>

export interface Message {
  type: 'user' | 'assistant'
  content: string[]
  isError: boolean
  isLoading?: boolean
  imageMeta?: ImageMeta
  timestamp: number
  model?: string | ''
}

type ChatStore = {
  messages: Message[]
  isGenerating: boolean
  inputPrompt: string

  isShowingApiKeyDialog: boolean
  toggleApiKeyDialog: (value: boolean) => any

  isShowingSettingFormSheet: boolean
  toggleSettingFormSheet: (value: boolean) => any

  onInputChange: (message: string) => any
  addMessage: () => any
  fixBrokenMessage: () => any
  clearMessages: () => any
  cancelGeneration: () => any
  imprintImage: (prompt: string, imageFile: File, maskFile?: File) => Promise<any>
}

let controller: AbortController

export const useChatStore = create(
  persist<ChatStore>(
    (set, get) => ({
      messages: [],
      isGenerating: false,
      inputPrompt: '',

      isShowingApiKeyDialog: false,
      toggleApiKeyDialog(value) {
        set({ isShowingApiKeyDialog: value })
      },

      isShowingSettingFormSheet: false,
      toggleSettingFormSheet(value) {
        set({ isShowingSettingFormSheet: value })
      },

      onInputChange(inputPrompt) {
        set(() => ({ inputPrompt }))
      },
      async addMessage() {
        const { style, size, apiKey, quality, model, noImage } = useConfigStore.getState()
        if (!apiKey) {
          get().toggleApiKeyDialog(true)
          return
        }

        if (get().isGenerating) return

        set(() => ({
          isGenerating: true,
          messages: [
            ...get().messages,
            { type: 'user', content: [get().inputPrompt], isError: false, timestamp: Date.now(), model: model || '' },
            {
              type: 'assistant',
              content: [''],
              isError: false,
              isLoading: true,
              timestamp: Date.now(),
              model: model || '',
            },
          ],
        }))
        const openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        })
        const options: ImageGenerateParams = {
          prompt: get().inputPrompt,
          model: model,
          n: model === 'dall-e-3' ? 1 : noImage,
          response_format: 'b64_json',
          size: size,
          style: style,
          quality: quality,
        }
        controller = new AbortController()
        const signal = controller.signal
        try {
          const completion = await openai.images.generate(options, {
            signal: signal,
          })
          const base64 = (completion.data?.map((image) => image.b64_json)?.filter((img) => img) as string[]) || []
          if (base64?.length === 0) throw new Error('invalid base64')
          const key: string[] = []
          for (const image of base64) {
            const uuid = await imageStore.storeImage('data:image/png;base64,' + image)
            key.push(uuid)
          }
          const imageMeta: ImageMeta = {
            style: useConfigStore.getState().style,
            size: useConfigStore.getState().size,
            quality: useConfigStore.getState().quality,
          }
          set(() => ({
            inputPrompt: '',
            messages: [
              ...get().messages.slice(0, -1),
              {
                type: 'assistant',
                model: model || '',
                content: key,
                imageMeta,
                isError: false,
                timestamp: Date.now(),
              },
            ],
          }))
        } catch (error: any) {
          set(() => ({
            messages: [
              ...get().messages.slice(0, -1),
              {
                type: 'assistant',
                content: error.message || 'Unknown error',
                isError: true,
                timestamp: Date.now(),
              },
            ],
          }))
          console.error(error)
        } finally {
          set(() => ({ isGenerating: false }))
        }
      },
      async imprintImage(prompt, imageFile, maskFile) {
        const { apiKey } = useConfigStore.getState()
        if (!apiKey) {
          console.error('API key is missing')
          return null
        }

        try {
          const openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
          })

          const body: ImageEditParams = {
            image: imageFile,
            prompt,
            mask: maskFile,
            model: 'dall-e-2',
            response_format: 'b64_json',
            size: '512x512',
          }

          const response = await openai.images.edit(body)

          console.log('Imprint result:', response)
          return response
        } catch (error) {
          console.error('Error imprinting image:', error)
          return null
        }
      },
      cancelGeneration() {
        controller?.abort()
        set(() => ({ isGenerating: false }))
      },
      fixBrokenMessage() {
        const lastMessage = get().messages[get().messages.length - 1]
        if (lastMessage?.isLoading) {
          set(() => ({
            messages: get().messages.slice(0, -1),
          }))
        }
      },
      clearMessages() {
        set(() => ({ messages: [] }))
        imageStore.clear()
      },
    }),
    {
      name: 'chat-store',
      //@ts-ignore TODO:
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
)
