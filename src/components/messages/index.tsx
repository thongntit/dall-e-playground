import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChatStore } from '../../stores/chat'
import { Message } from '../../types/chat'
import { imageStore } from '../../lib/image-persist'

interface ImageState {
  [key: string]: string | null
}

export function Messages() {
  const { topics, currentTopicId } = useChatStore()
  const [images, setImages] = useState<ImageState>({})

  const currentTopic = topics.find((topic) => topic.id === currentTopicId)
  const messages = currentTopic?.messages || []

  useEffect(() => {
    const loadImages = async () => {
      const newImages: ImageState = {}
      for (const message of messages) {
        if (message.imageMeta) {
          for (const imageId of message.content) {
            if (!images[imageId]) {
              const imageData = await imageStore.retrieveImage(imageId)
              newImages[imageId] = imageData
            }
          }
        }
      }
      setImages((prev) => ({ ...prev, ...newImages }))
    }

    loadImages()
  }, [messages])

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="flex flex-col gap-4 p-4 min-h-full">
        {messages.map((message: Message, index: number) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.isError
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100'
              }`}
            >
              {message.isLoading ? (
                <div className="animate-pulse">Generating...</div>
              ) : message.isError ? (
                <div className="text-red-500">{message.content[0]}</div>
              ) : message.imageMeta ? (
                <div className="space-y-2">
                  {message.content.map((imageId, idx) =>
                    images[imageId] ? (
                      <div key={idx} className="relative group">
                        <img
                          src={images[imageId] || ''}
                          alt={`Generated ${idx + 1}`}
                          className="max-w-full max-h-[500px] h-auto object-contain rounded-lg mx-auto"
                        />
                        {message.model === 'dall-e-3' ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white rounded-lg">
                            Image editing only available for DALL-E 2 images
                          </div>
                        ) : (
                          <Link
                            to={`/imprint?id=${imageId}`}
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white rounded-lg"
                          >
                            Edit Image
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div key={idx} className="w-full h-32 bg-gray-200 animate-pulse rounded-lg" />
                    ),
                  )}
                  <div className="text-xs text-gray-500">
                    {message.model && `${message.model} • `}
                    {message.imageMeta.size} • {message.imageMeta.quality} • {message.imageMeta.style}
                  </div>
                </div>
              ) : (
                <div>{message.content[0]}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
