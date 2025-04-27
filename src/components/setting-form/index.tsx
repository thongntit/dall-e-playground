import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
import { Quality, Size, Style, useConfigStore, Model, NoImage } from 'src/stores/config'
import { Background, Format } from 'src/types/chat'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { HelpCircle } from 'lucide-react'

const models: Model[] = ['dall-e-3', 'dall-e-2', 'gpt-image-1']
const sizes: Size[] = ['1024x1024', '1792x1024', '1024x1792']
const qualities: Quality[] = ['standard', 'hd']
const styles: Style[] = ['vivid', 'natural']

const configPerModel: Record<
  string,
  {
    noImages: NoImage[]
    sizes: Size[]
    qualities: Quality[]
    styles: Style[]
  }
> = {
  'dall-e-3': {
    noImages: [],
    sizes: ['1024x1024', '1792x1024', '1024x1792'],
    qualities: qualities,
    styles: styles,
  },
  'dall-e-2': {
    noImages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    sizes: ['256x256', '512x512', '1024x1024'],
    qualities: [],
    styles: [],
  },
  'gpt-image-1': {
    noImages: [1],
    sizes: ['1024x1024', '1792x1024', '1024x1536', 'auto'],
    qualities: ['high', 'medium', 'low', 'auto'],
    styles: [],
  },
}

export const SettingForm = () => {
  const {
    noImage,
    setNoImage,
    model,
    setModel,
    quality,
    setQuality,
    size,
    setSize,
    style,
    setStyle,
    apiKey,
    setAPIKey,
    reset,
    // GPT-Image-1 specific parameters
    background,
    setBackground,
    moderation,
    setModeration,
    outputFormat,
    setOutputFormat,
    outputCompression,
    setOutputCompression,
  } = useConfigStore()
  const { noImages, sizes, qualities, styles } = configPerModel[model || ''] || {}
  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex items-center justify-start border-b border-gray-200">
        Settings
        <Button size={'icon'} asChild variant={'ghost'}>
          <a href="https://platform.openai.com/docs/api-reference/images/create" target="_blank" rel="noreferrer">
            <HelpCircle size={16} />
          </a>
        </Button>
      </div>

      <div>
        <label className="block py-2">Model</label>
        <Select value={model || 'dall-e-3'} onValueChange={(value) => setModel(value as Model)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {models.map((item) => (
                <SelectItem value={item || 'dall-e-3'} key={item}>
                  {item?.toUpperCase()}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {model === 'gpt-image-1' && (
        <div>
          <label className="block py-2">Background</label>
          <Select value={background || 'auto'} onValueChange={(value) => setBackground(value as Background)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Background" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {['transparent', 'opaque', 'auto'].map((item) => (
                  <SelectItem value={item} key={item}>
                    {item.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {model === 'gpt-image-1' && (
        <div>
          <label className="block py-2">Output Format</label>
          <Select value={outputFormat || 'png'} onValueChange={(value) => setOutputFormat(value as Format)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Output Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {['png', 'jpeg', 'webp'].map((item) => (
                  <SelectItem value={item} key={item}>
                    {item.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {model === 'gpt-image-1' && (outputFormat === 'jpeg' || outputFormat === 'webp') && (
        <div>
          <label className="block py-2">Output Compression (0-100%)</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={outputCompression}
            onChange={(e) => setOutputCompression(Number(e.target.value))}
          />
        </div>
      )}

      {qualities?.length !== 0 && (
        <div>
          <label className="block py-2">Quality</label>
          <Select value={quality || 'auto'} onValueChange={(value) => setQuality(value as Quality)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {qualities.map((item) => (
                  <SelectItem value={item || ''} key={item}>
                    {item?.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {sizes?.length !== 0 && (
        <div>
          <label className="block py-2">Size</label>
          <Select value={size || ''} onValueChange={(value) => setSize(value as Size)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sizes.map((item) => (
                  <SelectItem value={item || ''} key={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {styles?.length !== 0 && (
        <div>
          <label className="block py-2">Style</label>
          <Select value={style!} onValueChange={(value) => setStyle(value as Style)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {styles.map((item) => (
                  <SelectItem value={item!} key={item}>
                    {item?.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {noImages?.length !== 0 && (
        <div>
          <label className="block py-2">Number of Images</label>
          <Select
            value={`${noImage || 1}`}
            onValueChange={(value) => setNoImage(Number(value) as NoImage)}
            disabled={model === 'dall-e-3' ? true : false}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {noImages.map((item) => (
                  <SelectItem value={`${item}`} key={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label className="block py-2">API Key</label>
        <Input value={apiKey} onChange={(e) => setAPIKey(e.target.value)} type="password"></Input>
      </div>

      <div className="flex justify-end">
        <Button onClick={reset} variant={'link'} className="underline">
          Reset to default
        </Button>
      </div>
    </div>
  )
}
