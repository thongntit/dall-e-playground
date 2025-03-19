import React, { useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useChatStore } from 'src/stores/chat'

const ViewImage: React.FC = () => {
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const imageSrc = queryParams.get('src')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasWidth = 1024
  const canvasHeight = 1024

  const [isDrawing, setIsDrawing] = useState(false)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [maskFile, setMaskFile] = useState<File | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>('')

  const { imprintImage } = useChatStore()

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

    // Draw the original image onto the mask canvas
    const image = new Image()
    image.src = imageSrc || ''
    image.onload = () => {
      const scaleX = maskCanvas.width / image.width
      const scaleY = maskCanvas.height / image.height

      maskCtx.drawImage(image, 0, 0, maskCanvas.width, maskCanvas.height)

      // Draw the shape in white, scaled to match the mask canvas
      maskCtx.fillStyle = 'white'
      maskCtx.beginPath()
      points.forEach((point, index) => {
        const scaledX = point.x * scaleX
        const scaledY = point.y * scaleY
        if (index === 0) {
          maskCtx.moveTo(scaledX, scaledY)
        } else {
          maskCtx.lineTo(scaledX, scaledY)
        }
      })
      maskCtx.closePath()
      maskCtx.globalCompositeOperation = 'destination-out' // Set to remove pixels
      maskCtx.fill()

      // Convert the mask canvas to a Data URL
      setMaskDataUrl(maskCanvas.toDataURL('image/png'))
    }
  }

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value)
  }

  const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customPrompt) {
      const canvas = canvasRef.current
      if (!canvas) return

      // Convert canvas to a File object
      // const imageDataUrl = canvas.toDataURL('image/png')
      const response = await fetch(imageSrc || '')
      const blob = await response.blob()
      const imageFile = new File([blob], 'image.png', { type: 'image/png' })
      setOriginalFile(imageFile)
      // Create the mask file
      // Convert canvas to a File object
      const maskResponse = await fetch(maskDataUrl || '')
      const maskBlob = await maskResponse.blob()
      const maskImageFile = new File([maskBlob], 'image.png', { type: 'image/png' })
      setMaskFile(maskImageFile)

      const result = await imprintImage(customPrompt, imageFile, maskImageFile)

      if (result && result.data) {
        const base64Image = result.data[0]?.b64_json
        if (base64Image) {
          setResultImage(`data:image/png;base64,${base64Image}`)
        }
      }
    }
  }

  if (!imageSrc) {
    return <div className="flex items-center justify-center h-full">No image to display</div>
  }

  return (
    <div className="flex items-center justify-center flex-col">
      <div className="relative flex space-x-4">
        <div>
          <img src={imageSrc} alt="Selected" className="max-w-full max-h-full" />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </div>
      <div>
        <p className="text-gray-600">Mask Preview:</p>
        <img src={maskDataUrl || ''} alt="Mask Preview" className="max-w-md max-h-md" />
      </div>
      <input
        type="text"
        value={customPrompt}
        onChange={handlePromptChange}
        onKeyPress={handleKeyPress}
        placeholder="Write your custom prompt here"
        className="mt-4 p-2 border border-gray-300 rounded"
      />
      <div>
        <p className="text-gray-600">Original Image:</p>
        <img src={originalFile ? URL.createObjectURL(originalFile) : ''} alt="Mask" className="max-w-md max-h-md" />
        <p className="text-gray-600">Mask Image:</p>
        <img src={maskFile ? URL.createObjectURL(maskFile) : ''} alt="Mask" className="max-w-md max-h-md" />
      </div>

      {resultImage && (
        <div className="mt-4 flex space-x-4">
          <div>
            <p className="text-gray-600">Result Image:</p>
            <img src={resultImage} alt="Result" className="max-w-md max-h-md" />
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewImage
