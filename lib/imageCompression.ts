/**
 * Image Compression Utility
 * Compresses images to ≤100KB while maintaining decent quality
 */

import imageCompression from 'browser-image-compression'

const TARGET_SIZE_KB = 100
const TARGET_SIZE_BYTES = TARGET_SIZE_KB * 1024

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  initialQuality?: number
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

/**
 * Compress an image file or blob to target size (≤100KB)
 * @param fileOrBlob - Image file or blob to compress
 * @param options - Optional compression settings
 * @returns Promise with compressed file and metadata
 */
export async function compressImageTo100KB(
  fileOrBlob: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const originalSize = fileOrBlob.size

  // If already under target, return as-is
  if (originalSize <= TARGET_SIZE_BYTES) {
    const file = fileOrBlob instanceof File 
      ? fileOrBlob 
      : new File([fileOrBlob], 'image.jpg', { type: fileOrBlob.type })
    
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    }
  }

  // Convert Blob to File if needed
  let inputFile = fileOrBlob instanceof File
    ? fileOrBlob
    : new File([fileOrBlob], 'image.jpg', { type: fileOrBlob.type })

  // Start with reasonable defaults
  let quality = options.initialQuality ?? 0.85
  let maxWidthOrHeight = options.maxWidthOrHeight ?? 1920
  let compressedFile = inputFile

  // Iterative compression to hit target
  const maxIterations = 5
  let iteration = 0

  while (compressedFile.size > TARGET_SIZE_BYTES && iteration < maxIterations) {
    iteration++

    const compressionOptions = {
      maxSizeMB: TARGET_SIZE_KB / 1024, // Convert to MB
      maxWidthOrHeight,
      useWebWorker: options.useWebWorker ?? true,
      initialQuality: quality,
      fileType: 'image/jpeg', // JPEG for better compression
    }

    try {
      compressedFile = await imageCompression(inputFile, compressionOptions)

      // If still too large, reduce quality and dimensions further
      if (compressedFile.size > TARGET_SIZE_BYTES) {
        quality = Math.max(0.5, quality - 0.15)
        maxWidthOrHeight = Math.max(800, Math.floor(maxWidthOrHeight * 0.8))
      }
    } catch (error) {
      console.error('[imageCompression] Compression iteration failed:', error)
      break
    }
  }

  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
    compressionRatio: compressedFile.size / originalSize,
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

/**
 * Convert a blob to base64 data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Create a cropped blob from canvas
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  // Set canvas size to final crop size
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the image
  ctx.save()
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-canvas.width / 2, -canvas.height / 2)

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  ctx.restore()

  // Return as blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Canvas toBlob failed'))
      }
    }, 'image/jpeg', 0.95)
  })
}

/**
 * Create an image element from a source URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}
