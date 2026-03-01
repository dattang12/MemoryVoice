import React, { useState, useCallback, useRef } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import type { PhotoFile } from '@/types'

// ============================================================
// Constants
// ============================================================

const MAX_PHOTOS = 30
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

// ============================================================
// PhotoPreview — newspaper photo with caption
// ============================================================

interface PhotoPreviewProps {
  photo: PhotoFile
  index: number
  onRemove: (id: string) => void
  onCaptionChange: (id: string, caption: string) => void
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ photo, index, onRemove, onCaptionChange }) => (
  <div className="relative group bg-white border border-[rgba(0,0,0,0.1)] overflow-hidden transition-shadow hover:shadow-card-hover">
    {/* Photo */}
    <div className="aspect-square relative overflow-hidden bg-memory-bg-secondary">
      <img
        src={photo.previewUrl}
        alt={`Photograph ${index + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      {/* Photo number */}
      <div className="absolute top-1.5 left-1.5 bg-memory-text text-white text-xs font-bold font-body px-1.5 py-0.5">
        #{index + 1}
      </div>
      {/* Remove overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-start justify-end p-2">
        <button
          type="button"
          onClick={() => onRemove(photo.id)}
          aria-label={`Remove photograph ${index + 1}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                     w-7 h-7 bg-memory-accent hover:bg-memory-accent-dim
                     flex items-center justify-center text-white text-sm font-bold
                     focus-visible:opacity-100"
        >
          ×
        </button>
      </div>
    </div>

    {/* Caption — newspaper photo caption style */}
    <div className="p-2 border-t border-[rgba(0,0,0,0.08)]">
      <input
        type="text"
        value={photo.caption}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onCaptionChange(photo.id, e.target.value)
        }
        placeholder="Add caption..."
        maxLength={500}
        className="w-full bg-transparent text-xs text-memory-text placeholder-memory-text-muted/60
                   border-b border-[rgba(0,0,0,0.12)] focus:border-memory-accent
                   pb-1 outline-none transition-colors duration-200 italic font-body"
      />
    </div>
  </div>
)

// ============================================================
// DropZone content
// ============================================================

const DropZoneContent: React.FC<{
  isDragActive: boolean
  isDragReject: boolean
  photoCount: number
}> = ({ isDragActive, isDragReject, photoCount }) => {
  if (isDragReject) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-3xl font-bold text-memory-accent font-heading">✕</div>
        <p className="text-memory-accent font-semibold font-body text-sm">
          Only JPEG, PNG and WebP files are accepted
        </p>
      </div>
    )
  }

  if (isDragActive) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-4xl font-bold text-memory-accent font-heading animate-bounce">↓</div>
        <p className="text-memory-accent font-bold font-body text-lg uppercase tracking-wider">
          Release to submit photographs
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="border-2 border-dashed border-memory-text-muted p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-memory-text-muted"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
      <div>
        <p className="text-memory-text font-bold font-heading text-lg mb-1">
          Drag &amp; drop photographs here
        </p>
        <p className="text-memory-text-muted text-sm font-body mb-3">
          or click to browse your files
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center text-xs text-memory-text-muted font-body">
          <span>JPEG &bull; PNG &bull; WebP</span>
          <span>Max 10 MB each</span>
          <span>Up to {MAX_PHOTOS} photos</span>
        </div>
      </div>
      {photoCount > 0 && (
        <p className="text-memory-text-muted text-sm font-body border-t border-[rgba(0,0,0,0.1)] pt-3 w-full">
          {photoCount} / {MAX_PHOTOS} added &mdash; click to add more
        </p>
      )}
    </div>
  )
}

// ============================================================
// Main PhotoUpload Component
// ============================================================

interface PhotoUploadProps {
  photos: PhotoFile[]
  onPhotosChange: (photos: PhotoFile[]) => void
  disabled?: boolean
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos,
  onPhotosChange,
  disabled = false,
}) => {
  const [errors, setErrors] = useState<string[]>([])
  const idCounterRef = useRef(0)

  const createPhotoId = useCallback((): string => {
    idCounterRef.current += 1
    return `photo-${Date.now()}-${idCounterRef.current}`
  }, [])

  const addPhotos = useCallback(
    (acceptedFiles: File[]): void => {
      const remaining = MAX_PHOTOS - photos.length
      if (remaining <= 0) {
        setErrors([`Maximum ${MAX_PHOTOS} photographs allowed`])
        return
      }
      const filesToAdd = acceptedFiles.slice(0, remaining)
      const skipped = acceptedFiles.length - filesToAdd.length
      const newErrors: string[] = []
      if (skipped > 0) {
        newErrors.push(`${skipped} photo(s) skipped — limit of ${MAX_PHOTOS} reached`)
      }
      const newPhotoFiles: PhotoFile[] = filesToAdd.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        caption: '',
        id: createPhotoId(),
      }))
      onPhotosChange([...photos, ...newPhotoFiles])
      setErrors(newErrors)
    },
    [photos, onPhotosChange, createPhotoId]
  )

  const handleRejections = useCallback((rejections: FileRejection[]): void => {
    const newErrors = rejections.map((rejection) => {
      const file = rejection.file
      const err = rejection.errors[0]
      if (err?.code === 'file-too-large') return `"${file.name}" exceeds 10 MB limit`
      if (err?.code === 'file-invalid-type') return `"${file.name}" is not JPEG, PNG or WebP`
      return `"${file.name}": ${err?.message ?? 'invalid file'}`
    })
    setErrors(newErrors.slice(0, 3))
  }, [])

  const removePhoto = useCallback(
    (id: string): void => {
      const photo = photos.find((p) => p.id === id)
      if (photo) URL.revokeObjectURL(photo.previewUrl)
      onPhotosChange(photos.filter((p) => p.id !== id))
      setErrors([])
    },
    [photos, onPhotosChange]
  )

  const updateCaption = useCallback(
    (id: string, caption: string): void => {
      onPhotosChange(photos.map((p) => (p.id === id ? { ...p, caption } : p)))
    },
    [photos, onPhotosChange]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDropAccepted: addPhotos,
    onDropRejected: handleRejections,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
    disabled: disabled || photos.length >= MAX_PHOTOS,
    multiple: true,
  })

  const canAddMore = photos.length < MAX_PHOTOS && !disabled

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed p-8 cursor-pointer
          transition-all duration-200 min-h-[180px] flex items-center justify-center
          ${isDragReject
            ? 'border-memory-accent bg-red-50'
            : isDragActive
            ? 'border-memory-accent bg-[rgba(192,57,43,0.04)] scale-[1.01]'
            : canAddMore
            ? 'border-[rgba(0,0,0,0.2)] bg-memory-bg hover:border-memory-accent hover:bg-[rgba(192,57,43,0.02)]'
            : 'border-[rgba(0,0,0,0.1)] bg-memory-bg-secondary cursor-not-allowed opacity-60'
          }
        `}
        aria-label="Photo upload area"
      >
        <input {...getInputProps()} aria-label="File input" />
        <DropZoneContent
          isDragActive={isDragActive}
          isDragReject={isDragReject}
          photoCount={photos.length}
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1 border-l-4 border-l-memory-accent pl-3">
          {errors.map((error, i) => (
            <p key={i} className="text-sm text-memory-accent font-body">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Photo count + clear */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between text-sm font-body">
          <p className="text-memory-text-muted">
            <span className="font-bold text-memory-accent">{photos.length}</span>
            {' '}/{' '}{MAX_PHOTOS} photographs
          </p>
          <button
            type="button"
            onClick={() => {
              photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
              onPhotosChange([])
              setErrors([])
            }}
            className="text-xs text-memory-text-muted hover:text-memory-accent transition-colors duration-200 border-b border-transparent hover:border-memory-accent"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {photos.map((photo, index) => (
            <PhotoPreview
              key={photo.id}
              photo={photo}
              index={index}
              onRemove={removePhoto}
              onCaptionChange={updateCaption}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PhotoUpload
