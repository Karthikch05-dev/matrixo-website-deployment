/**
 * Client-side image compression utility for profile photo uploads.
 * Uses HTML5 Canvas to resize and compress images before uploading to Firebase Storage.
 */

interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.85,
  maxSizeMB: 1.5,
}

/**
 * Compress an image File to fit within the specified dimensions and file size.
 * Returns a compressed Blob (JPEG) suitable for uploading.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

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

        // Draw onto canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        // Try compressing at the given quality, reduce if still too large
        let quality = opts.quality
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas toBlob failed'))
                return
              }
              // If still too large and quality can be reduced, try again
              if (blob.size > opts.maxSizeMB * 1024 * 1024 && quality > 0.3) {
                quality -= 0.1
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
