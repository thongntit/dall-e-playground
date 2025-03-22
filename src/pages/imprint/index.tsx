import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useChatStore } from 'src/stores/chat'
import { imageStore } from 'src/lib/image-persist'

const ImprintImage: React.FC = () => {
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const imageId = queryParams.get('id') // Use 'id' instead of 'src'
  const [foundImage, setFoundImage] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>('')

  // drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(1024)
  const [canvasHeight, setCanvasHeight] = useState(1024)
  const [isDrawing, setIsDrawing] = useState(false)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([])

  const { imprintImage } = useChatStore()

  useEffect(() => {
    const updateCanvasSize = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const size = Math.min(viewportWidth, viewportHeight) * 0.9 // Scale to 90% of the smaller dimension
      setCanvasWidth(size)
      setCanvasHeight(size)
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  useEffect(() => {
    if (imageId) {
      ;(async () => {
        const retrievedImage = await imageStore.retrieveImage(imageId)
        setFoundImage(!!retrievedImage)

        const canvas = canvasRef.current
        if (canvas && retrievedImage) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const image = new Image()
            image.src = retrievedImage
            image.onload = async () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

              // Preserve the canvas state for later transformation
              const canvasDataUrl = canvas.toDataURL('image/png')
              const preservedImageFile = await dataURLToFile(canvasDataUrl, 'preserved-image.png')
              setOriginalFile(preservedImageFile)
            }
          }
        }
      })()
    }
  }, [imageId, canvasWidth, canvasHeight])

  const dataURLToFile = async (dataURL: string, fileName: string): Promise<File> => {
    const response = await fetch(dataURL)
    const blob = await response.blob()
    return new File([blob], fileName, { type: blob.type })
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    setPoints([{ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }])
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    ctx.stroke()

    setPoints((prevPoints) => [...prevPoints, { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }])
  }

  const stopDrawing = () => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Close the shape and fill it
    ctx.closePath()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)' // Semi-transparent overlay
    ctx.fill()

    setIsDrawing(false)
    // setPoints([])
    updateMaskPreview()
  }

  const updateMaskPreview = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = canvasWidth
    maskCanvas.height = canvasHeight
    const maskCtx = maskCanvas.getContext('2d')
    if (!maskCtx) return

    // Draw the original canvas content onto the mask canvas
    const canvasCtx = canvas.getContext('2d')
    if (canvasCtx) {
      const canvasImageData = canvasCtx.getImageData(0, 0, canvasWidth, canvasHeight)
      maskCtx.putImageData(canvasImageData, 0, 0)
    }

    // Draw the shape in white on the mask canvas
    maskCtx.fillStyle = 'white'
    maskCtx.beginPath()
    points.forEach((point, index) => {
      if (index === 0) {
        maskCtx.moveTo(point.x, point.y)
      } else {
        maskCtx.lineTo(point.x, point.y)
      }
    })
    maskCtx.closePath()
    maskCtx.globalCompositeOperation = 'destination-out' // Set to remove pixels
    maskCtx.fill()

    // Convert the mask canvas to a Data URL
    setMaskDataUrl(maskCanvas.toDataURL('image/png'))
  }

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value)
  }

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customPrompt) {
      const canvas = canvasRef.current
      if (!canvas) return

      // Create the mask file
      const maskFile = maskDataUrl ? await dataURLToFile(maskDataUrl, 'mask-image.png') : null

      if (!originalFile || !maskFile) return
      const result = await imprintImage(customPrompt, originalFile, maskFile)

      if (result && result.data) {
        const base64Image = result.data[0]?.b64_json
        if (base64Image) {
          setResultImage(`data:image/png;base64,${base64Image}`)
        }
        openModal()
      }
    }
  }

  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  if (!foundImage) {
    return <div className="flex items-center justify-center h-full">No image to display</div>
  }

  return (
    <div className="flex items-center justify-center flex-col">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border"
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      <input
        type="text"
        value={customPrompt}
        onChange={handlePromptChange}
        onKeyDown={handleKeyPress}
        placeholder="Write your custom prompt here"
        className="absolute bottom-5 left-auto p-2 border border-gray-300 rounded"
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative">
            <button onClick={closeModal} className="absolute top-2 right-2 text-white bg-gray-800 rounded-full p-2">
              ✕
            </button>
            <img src={resultImage || ''} alt="Result in Modal" className="max-w-full max-h-full" />
          </div>
        </div>
      )}
    </div>
  )
}

export default ImprintImage
