'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCamera, FaTimes, FaUpload, FaTrash, FaCheck, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore'
import { storage, db } from '@/lib/firebaseConfig'
import { toast } from 'sonner'

// ============================================
// CONSTANTS & TYPES
// ============================================

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 3 * 1024 * 1024 // 3MB
const OUTPUT_SIZE = 512 // 512×512 px output

interface ProfilePhotoUploadProps {
  employeeId: string
  currentImageUrl?: string
  employeeName: string
  darkMode?: boolean
  /** Called after a successful upload or delete with the new URL ('' for delete) */
  onImageUpdated?: (newUrl: string) => void
}

// ============================================
// CLIENT-SIDE IMAGE PROCESSING
// ============================================

/** Resize and center-crop an image File to OUTPUT_SIZE×OUTPUT_SIZE WebP using Canvas */
async function processImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')!

      // Center-crop: fill the square from the center of the source image
      const srcSize = Math.min(img.width, img.height)
      const srcX = (img.width - srcSize) / 2
      const srcY = (img.height - srcSize) / 2

      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        'image/webp',
        0.88 // quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

/** Validate a File before processing */
function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type "${file.type}". Accepted: JPEG, PNG, WebP`
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 3MB`
  }
  return null
}

// ============================================
// INITIALS AVATAR (fallback)
// ============================================
function InitialsAvatar({ name, size = 128 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold select-none"
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {initials}
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProfilePhotoUpload({
  employeeId,
  currentImageUrl,
  employeeName,
  darkMode = true,
  onImageUpdated,
}: ProfilePhotoUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Ensure we're client-side before using createPortal ──────────────────
  useEffect(() => setMounted(true), [])

  // ── Lock body scroll while modal is open ────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ── Close & reset modal ─────────────────────────────────────────────────
  const closeModal = useCallback(() => {
    setIsOpen(false)
    setPreview(null)
    setSelectedFile(null)
    setDragActive(false)
    setProgress(0)
    setValidationError(null)
  }, [])

  // ── Handle file selection ───────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setValidationError(error)
      setPreview(null)
      setSelectedFile(null)
      return
    }
    setValidationError(null)
    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  // ── Drag & drop handlers ────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }
  const handleDragLeave = () => setDragActive(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile || !employeeId) return

    setUploading(true)
    setProgress(0)

    try {
      // 1. Process image client-side (resize + crop + webp)
      const processedBlob = await processImage(selectedFile)

      // 2. Build storage path
      const timestamp = Date.now()
      const storagePath = `profile-images/${employeeId}/${timestamp}.webp`
      const storageRef = ref(storage, storagePath)

      // 3. Upload with progress tracking
      await new Promise<void>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, processedBlob, {
          contentType: 'image/webp',
        })

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            setProgress(pct)
          },
          (error) => reject(error),
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)

              // 4. Update Firestore – query by employeeId field to find the actual document
              const employeesRef = collection(db, 'Employees')
              const q = query(employeesRef, where('employeeId', '==', employeeId))
              const querySnapshot = await getDocs(q)

              if (querySnapshot.empty) {
                throw new Error('Employee record not found')
              }

              await updateDoc(querySnapshot.docs[0].ref, {
                profileImage: downloadUrl,
                imageUpdatedAt: serverTimestamp(),
              })

              onImageUpdated?.(downloadUrl)
              toast.success('Profile photo updated successfully!')
              closeModal()
              resolve()
            } catch (err) {
              reject(err)
            }
          }
        )
      })
    } catch (err) {
      console.error('[ProfilePhotoUpload] Upload error:', err)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  // ── Delete photo ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!employeeId) return
    if (!window.confirm('Remove your profile photo? Your initials will be shown instead.')) return

    setUploading(true)
    try {
      // Query for the actual Firestore document by employeeId field
      const employeesRef = collection(db, 'Employees')
      const q = query(employeesRef, where('employeeId', '==', employeeId))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error('Employee record not found')
      }

      // Remove from Firestore first so the UI updates immediately
      await updateDoc(querySnapshot.docs[0].ref, {
        profileImage: '',
        imageUpdatedAt: serverTimestamp(),
      })

      // Best-effort: try to delete the old file from Storage (it may not be a Firebase Storage URL)
      if (currentImageUrl && currentImageUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const oldRef = ref(storage, currentImageUrl)
          await deleteObject(oldRef)
        } catch {
          // Ignore – the file may have already been deleted or the URL path is incorrect
        }
      }

      onImageUpdated?.('')
      toast.success('Profile photo removed.')
      closeModal()
    } catch (err) {
      console.error('[ProfilePhotoUpload] Delete error:', err)
      toast.error('Failed to remove photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Change Photo Button (trigger) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
          ${darkMode
            ? 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
            : 'bg-black/8 text-gray-800 hover:bg-black/15 border border-black/10'}
        `}
      >
        <FaCamera size={14} />
        Change Photo
      </button>

      {/* Modal – rendered in a portal so parent transforms can't break fixed centering */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Update Profile Photo"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.80)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            />

            {/* Modal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="relative z-10 w-full max-w-md rounded-2xl shadow-2xl shadow-black/60"
              style={{
                background: darkMode
                  ? 'rgba(14,14,20,0.97)'
                  : 'rgba(255,255,255,0.97)',
                border: darkMode
                  ? '1px solid rgba(255,255,255,0.12)'
                  : '1px solid rgba(0,0,0,0.1)',
              }}
            >
              {/* Gradient accent */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 via-transparent to-purple-600/10 pointer-events-none" />

              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{
                  borderBottom: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                }}
              >
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Update Profile Photo
                </h3>
                <button
                  onClick={closeModal}
                  disabled={uploading}
                  className={`p-2 rounded-xl transition-all ${darkMode ? 'text-neutral-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-800 hover:bg-black/8'}`}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Current / Preview avatar */}
                <div className="flex justify-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-blue-500/40">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : currentImageUrl ? (
                      <img
                        src={currentImageUrl}
                        alt={employeeName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <InitialsAvatar name={employeeName} size={128} />
                    )}
                  </div>
                </div>

                {/* Drag & Drop Zone */}
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
                    ${dragActive
                      ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                      : darkMode
                        ? 'border-white/15 hover:border-white/30 hover:bg-white/5'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/80'}
                    ${uploading ? 'pointer-events-none opacity-50' : ''}
                  `}
                >
                  <FaUpload
                    className={`mx-auto mb-3 ${darkMode ? 'text-neutral-400' : 'text-gray-400'}`}
                    size={22}
                  />
                  <p className={`text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>
                    {dragActive ? 'Drop to select' : 'Click or drag & drop an image'}
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-neutral-500' : 'text-gray-400'}`}>
                    JPEG · PNG · WebP · Max 3MB
                  </p>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleInputChange}
                  className="hidden"
                />

                {/* Validation error */}
                <AnimatePresence>
                  {validationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-start gap-3 px-4 py-3 bg-red-500/12 border border-red-500/30 rounded-xl text-red-400 text-sm"
                    >
                      <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
                      <span>{validationError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload progress bar */}
                <AnimatePresence>
                  {uploading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className={darkMode ? 'text-neutral-400' : 'text-gray-500'}>
                          {progress < 100 ? 'Uploading…' : 'Processing…'}
                        </span>
                        <span className={darkMode ? 'text-neutral-300' : 'text-gray-700'}>
                          {progress}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{
                          background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        }}
                      >
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="flex flex-col gap-3">
                  {/* Upload button */}
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className={`
                      w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200
                      ${selectedFile && !uploading
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-400 hover:to-purple-500 shadow-lg shadow-blue-500/25'
                        : darkMode
                          ? 'bg-white/5 text-neutral-500 cursor-not-allowed'
                          : 'bg-black/5 text-gray-400 cursor-not-allowed'}
                    `}
                  >
                    {uploading ? (
                      <>
                        <FaSpinner className="animate-spin" size={14} />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <FaCheck size={13} />
                        Save Photo
                      </>
                    )}
                  </button>

                  {/* Remove photo button (only if current image exists) */}
                  {currentImageUrl && !uploading && (
                    <button
                      onClick={handleDelete}
                      disabled={uploading}
                      className={`
                        w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all
                        text-red-400 hover:text-red-300
                        ${darkMode ? 'hover:bg-red-500/10 border border-red-500/20' : 'hover:bg-red-50 border border-red-200'}
                      `}
                    >
                      <FaTrash size={12} />
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Info note */}
                <p className={`text-xs text-center ${darkMode ? 'text-neutral-600' : 'text-gray-400'}`}>
                  Photos are resized to 512×512 and stored securely.
                  <br />
                  Only you and admins can change this photo.
                </p>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
