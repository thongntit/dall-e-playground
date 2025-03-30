import { OpenAI } from 'openai'
import { ImageGenerateParams, ImageEditParams } from 'openai/resources'
import { imageStore } from 'src/lib/image-persist'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useConfigStore } from './config'
import { ChatTopic, Message, ImageMeta } from '../types/chat'
import { nanoid } from 'nanoid'

interface ChatStore {
  topics: ChatTopic[]
  currentTopicId: string | null
  isGenerating: boolean
  inputPrompt: string

  isShowingApiKeyDialog: boolean
  toggleApiKeyDialog: (value: boolean) => void

  isShowingSettingFormSheet: boolean
  toggleSettingFormSheet: (value: boolean) => void

  // Topic management
  createTopic: (title: string) => void
  selectTopic: (id: string) => void
  deleteTopic: (id: string) => void
  renameTopic: (id: string, newTitle: string) => void

  // Message management
  onInputChange: (message: string) => void
  addMessage: () => void
  fixBrokenMessage: () => void
  clearMessages: () => void
  cancelGeneration: () => void
  imprintImage: (prompt: string, imageFile: File, maskFile?: File) => Promise<OpenAI.ImagesResponse | null>
}

let controller: AbortController

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      topics: [],
      currentTopicId: null,
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

      createTopic(title) {
        const newTopic: ChatTopic = {
          id: nanoid(),
          title,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({
          topics: [...state.topics, newTopic],
          currentTopicId: newTopic.id,
        }))
      },

      selectTopic(id) {
        set({ currentTopicId: id })
      },

      deleteTopic(id) {
        set((state) => ({
          topics: state.topics.filter((topic) => topic.id !== id),
          currentTopicId: state.currentTopicId === id ? null : state.currentTopicId,
        }))
      },

      renameTopic(id, newTitle) {
        set((state) => ({
          topics: state.topics.map((topic) =>
            topic.id === id ? { ...topic, title: newTitle, updatedAt: Date.now() } : topic,
          ),
        }))
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

        const currentTopic = get().topics.find((t) => t.id === get().currentTopicId)
        if (!currentTopic) {
          // Create a new topic if none is selected
          get().createTopic(get().inputPrompt.slice(0, 30) + '...')
        }

        if (get().isGenerating) return

        const newMessage: Message = {
          type: 'user',
          content: [get().inputPrompt],
          isError: false,
          timestamp: Date.now(),
          model: model || '',
        }

        const loadingMessage: Message = {
          type: 'assistant',
          content: [''],
          isError: false,
          isLoading: true,
          timestamp: Date.now(),
          model: model || '',
        }

        set((state) => ({
          isGenerating: true,
          topics: state.topics.map((topic) =>
            topic.id === state.currentTopicId
              ? {
                  ...topic,
                  messages: [...topic.messages, newMessage, loadingMessage],
                  updatedAt: Date.now(),
                }
              : topic,
          ),
        }))

        const openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        })

        const options: ImageGenerateParams = {
          prompt: get().inputPrompt,
          model: model || 'dall-e-3',
          n: model === 'dall-e-3' ? 1 : noImage,
          response_format: 'b64_json',
          size: size || '1024x1024',
          style: style || 'vivid',
          quality: quality || 'standard',
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
            style: useConfigStore.getState().style || 'vivid',
            size: useConfigStore.getState().size || '1024x1024',
            quality: useConfigStore.getState().quality || 'standard',
          }

          set((state) => ({
            inputPrompt: '',
            topics: state.topics.map((topic) =>
              topic.id === state.currentTopicId
                ? {
                    ...topic,
                    messages: [
                      ...topic.messages.slice(0, -1),
                      {
                        type: 'assistant',
                        model: model || '',
                        content: key,
                        imageMeta,
                        isError: false,
                        timestamp: Date.now(),
                      },
                    ],
                    updatedAt: Date.now(),
                  }
                : topic,
            ),
          }))
        } catch (error: any) {
          set((state) => ({
            topics: state.topics.map((topic) =>
              topic.id === state.currentTopicId
                ? {
                    ...topic,
                    messages: [
                      ...topic.messages.slice(0, -1),
                      {
                        type: 'assistant',
                        content: [error.message || 'Unknown error'],
                        isError: true,
                        timestamp: Date.now(),
                      },
                    ],
                    updatedAt: Date.now(),
                  }
                : topic,
            ),
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
        set((state) => ({
          topics: state.topics.map((topic) =>
            topic.id === state.currentTopicId && topic.messages[topic.messages.length - 1]?.isLoading
              ? {
                  ...topic,
                  messages: topic.messages.slice(0, -1),
                  updatedAt: Date.now(),
                }
              : topic,
          ),
        }))
      },

      clearMessages() {
        set((state) => ({
          topics: state.topics.map((topic) =>
            topic.id === state.currentTopicId ? { ...topic, messages: [], updatedAt: Date.now() } : topic,
          ),
        }))
        imageStore.clear()
      },
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        topics: state.topics,
        currentTopicId: state.currentTopicId,
      }),
    },
  ),
)
