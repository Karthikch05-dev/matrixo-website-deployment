'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Cropper from 'react-easy-crop'
import { Area } from 'react-easy-crop'
import { FaTimes, FaCheck, FaSpinner, FaUndo, FaSearchPlus, FaSearchMinus } from 'react-icons/fa'
import { getCroppedImg, compressImageTo100KB, formatFileSize } from '@/lib/imageCompression'
import { toast } from 'sonner'

export interface CropModalProps {
  isOpen: boolean
  imageSrc: string
  aspectRatio: number // e.g., 1 for square (profile), 820/360 for cover
  onClose: () => void
  onComplete: (croppedBlob: Blob, compressionInfo: { originalSize: number; compressedSize: number }) => void
  title?: string
  cropShape?: 'rect' | 'round'
  darkMode?: boolean
}

export default function ImageCropModal({
  isOpen,
  imageSrc,
  aspectRatio,
  onClose,
  onComplete,
  title = 'Crop Image',
  cropShape = 'rect',
  darkMode = true,
}: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState<{ original: number; compressed: number } | null>(null)

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCrop = async () => {
    if (!croppedAreaPixels) {
      toast.error('Please adjust the crop area')
      return
    }

    setProcessing(true)
    try {
      // 1. Get cropped image
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      
      // 2. Compress to ≤100KB
      const result = await compressImageTo100KB(croppedBlob)
      
      setCompressionInfo({
        original: result.originalSize,
        compressed: result.compressedSize,
      })

      // 3. Convert compressed file back to blob
      const finalBlob = new Blob([result.file], { type: result.file.type })
      
      // 4. Show success message with size info
      toast.success(
        `Image processed! ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)}`
      )

      // 5. Call parent callback
      onComplete(finalBlob, {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
      })

      // Reset and close
      resetState()
      onClose()
    } catch (error) {
      console.error('[ImageCropModal] Processing error:', error)
      toast.error('Failed to process image. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const resetState = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    setCompressionInfo(null)
  }

  const handleClose = () => {
    if (!processing) {
      resetState()
      onClose()
    }
  }

  const cardStyle: React.CSSProperties = darkMode
    ? {
        background: 'rgba(14,14,20,0.97)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }
    : {
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(0,0,0,0.1)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.1)',
      }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-3xl rounded-3xl overflow-hidden"
            style={cardStyle}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
            >
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h3>
              <button
                onClick={handleClose}
                disabled={processing}
                className={`p-2 rounded-xl transition-all ${
                  darkMode
                    ? 'text-neutral-400 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-black/8'
                } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Crop Area */}
            <div className="relative w-full h-[400px] sm:h-[500px] bg-black/30">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                cropShape={cropShape}
                showGrid={true}
                style={{
                  containerStyle: {
                    background: darkMode ? '#0a0a0f' : '#1a1a1f',
                  },
                  cropAreaStyle: {
                    border: '2px solid rgba(59, 130, 246, 0.8)',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  },
                }}
              />
            </div>

            {/* Controls */}
            <div className="p-6 space-y-4">
              {/* Zoom Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <FaSearchPlus className="inline mr-1.5 mb-0.5" size={12} />
                    Zoom
                  </label>
                  <span className={`text-xs ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: darkMode
                      ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.1) ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.1) 100%)`
                      : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((zoom - 1) / 2) * 100}%, rgba(0,0,0,0.1) ${((zoom - 1) / 2) * 100}%, rgba(0,0,0,0.1) 100%)`,
                  }}
                />
              </div>

              {/* Rotation Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <FaUndo className="inline mr-1.5 mb-0.5" size={12} />
                    Rotation
                  </label>
                  <span className={`text-xs ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
                    {rotation}°
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: darkMode
                      ? `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(rotation / 360) * 100}%, rgba(255,255,255,0.1) ${(rotation / 360) * 100}%, rgba(255,255,255,0.1) 100%)`
                      : `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(rotation / 360) * 100}%, rgba(0,0,0,0.1) ${(rotation / 360) * 100}%, rgba(0,0,0,0.1) 100%)`,
                  }}
                />
              </div>

              {/* Compression Info */}
              {compressionInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs text-center py-2 px-3 rounded-lg"
                  style={{
                    background: darkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: darkMode ? '#86efac' : '#15803d',
                  }}
                >
                  Compressed: {formatFileSize(compressionInfo.original)} → {formatFileSize(compressionInfo.compressed)}
                </motion.div>
              )}

              {/* Info Text */}
              <p className={`text-xs text-center ${darkMode ? 'text-neutral-600' : 'text-gray-400'}`}>
                {aspectRatio === 1
                  ? 'Square crop (1:1) • Automatically compressed to ≤100KB'
                  : `${Math.round(aspectRatio * 100) / 100}:1 aspect ratio • Automatically compressed to ≤100KB`}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  disabled={processing}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                    darkMode
                      ? 'bg-white/5 text-neutral-300 hover:bg-white/10 border border-white/10'
                      : 'bg-black/5 text-gray-700 hover:bg-black/10 border border-black/10'
                  } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCrop}
                  disabled={processing}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                    processing
                      ? 'bg-blue-500/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 shadow-lg shadow-blue-500/25'
                  } text-white`}
                >
                  {processing ? (
                    <>
                      <FaSpinner className="animate-spin" size={14} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheck size={14} />
                      Apply & Compress
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
