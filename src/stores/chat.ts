import { OpenAI } from 'openai'
import { ImageEditParams } from 'openai/resources'
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

  // Prompt enhancement
  enhancePrompt: (userPrompt: string) => Promise<string>

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

      async enhancePrompt(userPrompt: string): Promise<string> {
        const { apiKey } = useConfigStore.getState()

        if (!apiKey) {
          return userPrompt // Return original if no API key
        }

        const openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        })

        try {
          const response = await openai.chat.completions.create({
            model: 'gpt-4', // Or gpt-3.5-turbo if preferred
            messages: [
              {
                role: 'system',
                content:
                  "You are an expert at enhancing image generation prompts. Add more descriptive details while maintaining the user's original intent. Don't change the subject or style, just make it more detailed.",
              },
              {
                role: 'user',
                content: `Original prompt: "${userPrompt}"`,
              },
            ],
            functions: [
              {
                name: 'enhance_image_prompt',
                description: 'Enhance an image generation prompt with more descriptive details',
                parameters: {
                  type: 'object',
                  properties: {
                    enhancedPrompt: {
                      type: 'string',
                      description:
                        'The enhanced prompt with more descriptive details while maintaining the original intent',
                    },
                  },
                  required: ['enhancedPrompt'],
                },
              },
            ],
            function_call: { name: 'enhance_image_prompt' },
          })

          const functionCall = response.choices[0]?.message?.function_call

          if (functionCall && functionCall.name === 'enhance_image_prompt') {
            try {
              const args = JSON.parse(functionCall.arguments)
              return args.enhancedPrompt
            } catch (e) {
              console.error('Error parsing function call arguments:', e)
            }
          }
        } catch (error) {
          console.error('Error enhancing prompt:', error)
        }

        // Fallback to original prompt if anything fails
        return userPrompt
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

        // Generate enhanced prompt
        let enhancedPrompt: string
        try {
          enhancedPrompt = await get().enhancePrompt(get().inputPrompt)

          // Update loading message to show enhanced prompt
          set((state) => ({
            topics: state.topics.map((topic) =>
              topic.id === state.currentTopicId
                ? {
                    ...topic,
                    messages: [
                      ...topic.messages.slice(0, -1),
                      {
                        ...topic.messages[topic.messages.length - 1],
                        content: ['Generating image...'],
                        enhancedPrompt, // Add enhanced prompt to loading message
                      },
                    ],
                    updatedAt: Date.now(),
                  }
                : topic,
            ),
          }))
        } catch (error) {
          console.error('Failed to enhance prompt:', error)
          enhancedPrompt = get().inputPrompt // Fallback to original
        }

        const options: any = {
          prompt: enhancedPrompt, // Use enhanced prompt for image generation
          model: model || 'dall-e-3',
          n: model === 'dall-e-3' || model === 'gpt-image-1' ? 1 : noImage,
          size: size || '1024x1024',
        }

        // response_format is not supported by gpt-image-1
        if (model !== 'gpt-image-1') {
          options.response_format = 'b64_json'
        }

        // Add model-specific parameters
        if (model === 'dall-e-3') {
          options.style = style || 'vivid'
          options.quality = quality || 'standard'
        } else if (model === 'gpt-image-1') {
          const { background, moderation, outputCompression, outputFormat } = useConfigStore.getState()
          options.quality = quality // For gpt-image-1: 'high', 'medium', 'low', 'auto'

          // Add gpt-image-1 specific parameters
          // Use type assertion for gpt-image-1 specific parameters
          const gptImageOptions = options as any
          if (background) gptImageOptions.background = background
          if (moderation) gptImageOptions.moderation = moderation
          if (outputCompression !== undefined) gptImageOptions.output_compression = outputCompression
          if (outputFormat) gptImageOptions.output_format = outputFormat

          // Note: format and compression parameters are not supported by the API
          // despite being in the SDK type definitions
        } else if (model === 'dall-e-2') {
          // DALL-E 2 has no style or quality parameters
        }

        controller = new AbortController()
        const signal = controller.signal

        try {
          const completion = await openai.images.generate(options, {
            signal: signal,
          })

          let base64: string[] = []

          // Handle different response formats for different models
          if (model === 'gpt-image-1' && completion.data) {
            // gpt-image-1 returns base64-encoded images directly
            base64 = completion.data
              .map((image) => {
                // Check if b64_json exists, otherwise use the raw string which should be base64
                return image.b64_json || (image as any).base64
              })
              .filter(Boolean) as string[]

            // Log token usage if available (gpt-image-1 model returns this)
            if (completion.usage) {
              console.log('Token usage for image generation:', completion.usage)
            }
          } else {
            // For DALL-E models
            base64 = (completion.data?.map((image) => image.b64_json)?.filter((img) => img) as string[]) || []
          }

          if (base64?.length === 0) throw new Error('invalid base64')

          const key: string[] = []
          for (const image of base64) {
            const uuid = await imageStore.storeImage('data:image/png;base64,' + image)
            key.push(uuid)
          }

          const imageMeta: ImageMeta = {
            size: useConfigStore.getState().size || '1024x1024',
          }

          // Add model-specific metadata
          if (model === 'dall-e-3') {
            imageMeta.style = useConfigStore.getState().style || 'vivid'
            imageMeta.quality = useConfigStore.getState().quality || 'standard'
          } else if (model === 'gpt-image-1') {
            const config = useConfigStore.getState()
            imageMeta.quality = config.quality
            imageMeta.background = config.background

            // Note: format and compression are not included in metadata
            // since they're not supported by the API
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
                        enhancedPrompt, // Store the enhanced prompt
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
