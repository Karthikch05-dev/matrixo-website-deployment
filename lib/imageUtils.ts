/**
 * Client-side image compression and processing utilities
 * Enhanced for profile/cover photos with advanced compression (target: <= 100KB)
 */

interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
  maxSizeKB?: number // New: specific KB limit
}

const DEFAULT_OPTIONS: Required<Omit<CompressOptions, 'maxSizeKB'>> = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.85,
  maxSizeMB: 1.5,
}

/**
 * Compress an image File to fit within the specified dimensions and file size.
 * Returns a compressed Blob (JPEG) suitable for uploading.
 * Enhanced version with aggressive compression for <= 100KB target
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const targetSizeBytes = options.maxSizeKB 
    ? options.maxSizeKB * 1024 
    : opts.maxSizeMB * 1024 * 1024

  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img
        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // Draw onto canvas with high-quality smoothing
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Aggressive compression loop to meet size target
        let quality = opts.quality
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas toBlob failed'))
                return
              }
              
              // If still too large and quality can be reduced, try again
              if (blob.size > targetSizeBytes && quality > 0.1) {
                quality -= 0.05
                tryCompress()
              } else {
                resolve(blob)
              }
            },
            'image/jpeg',
            quality
          )
        }
        tryCompress()
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))

    // Load the file as a data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Create a cropped image from source with specific crop area
 */
export async function createCroppedImage(
  imageSrc: string,
  cropArea: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.src = imageSrc
    
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { alpha: false })
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      canvas.width = cropArea.width
      canvas.height = cropArea.height
      
      // High-quality rendering
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      )
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        0.95
      )
    }
    
    image.onerror = () => reject(new Error('Failed to load image'))
  })
}

/**
 * Convert blob to File object
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { 
    type: blob.type || 'image/jpeg',
    lastModified: Date.now()
  })
}

/**
 * Validate image file type and size
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please select a valid image file'
  }
  
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) {
    return `Image must be less than ${maxSizeMB}MB`
  }
  
  return null
}

/**
 * Convert File to data URL for preview
 */
export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}
