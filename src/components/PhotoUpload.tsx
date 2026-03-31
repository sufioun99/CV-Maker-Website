'use client'
import { useState, useRef, useCallback } from 'react'

export type PhotoShape = 'circle' | 'rounded' | 'square'

interface PhotoUploadProps {
  value?: string          // base64 data URL
  shape?: PhotoShape
  onPhotoChange: (base64: string | undefined) => void
  onShapeChange?: (shape: PhotoShape) => void
}

const SHAPES: { id: PhotoShape; label: string }[] = [
  { id: 'circle',  label: 'Circle'  },
  { id: 'rounded', label: 'Rounded' },
  { id: 'square',  label: 'Square'  },
]

const MAX_SIZE_MB = 2
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export default function PhotoUpload({ value, shape = 'circle', onPhotoChange, onShapeChange }: PhotoUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [error, setError]       = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const shapeClass = shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-2xl' : 'rounded-none'

  const processFile = useCallback((file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Please upload a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`Image must be under ${MAX_SIZE_MB} MB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result as string
      // Compress via canvas
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_DIM = 400
        let { width, height } = img
        if (width > height) {
          if (width > MAX_DIM) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM }
        } else {
          if (height > MAX_DIM) { width = Math.round(width * MAX_DIM / height); height = MAX_DIM }
        }
        canvas.width  = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        onPhotoChange(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }, [onPhotoChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Preview / Drop Zone */}
      <div className="flex items-start gap-5">
        {/* Photo preview */}
        <div
          className={`relative flex-shrink-0 w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all ${shapeClass}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          title="Click or drag photo here"
          style={dragging ? { borderColor: '#3b82f6', background: '#eff6ff' } : undefined}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Profile" className={`w-full h-full object-cover ${shapeClass}`} />
          ) : (
            <div className="text-center p-2">
              <span className="text-2xl block mb-1">📷</span>
              <span className="text-[10px] text-gray-400 leading-tight block">Click or drag</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 mb-2">Profile Photo</p>
          <p className="text-xs text-gray-400 mb-3">JPG, PNG or WebP · max {MAX_SIZE_MB} MB · auto-resized to 400px</p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {value ? 'Change photo' : 'Upload photo'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onPhotoChange(undefined)}
                className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Shape selector */}
      {onShapeChange && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Photo Shape</p>
          <div className="flex gap-2">
            {SHAPES.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => onShapeChange(s.id)}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 border-2 rounded-lg text-xs font-medium transition-all ${
                  shape === s.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <div className={`w-7 h-7 bg-blue-200 ${s.id === 'circle' ? 'rounded-full' : s.id === 'rounded' ? 'rounded-lg' : 'rounded-none'}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
        aria-label="Upload profile photo"
      />
    </div>
  )
}
