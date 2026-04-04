// ============================================================
// Profile Image Component
// Circular profile photo overlapping the cover image
// Includes edit functionality with hover effect
// ============================================================

'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCamera, FaSpinner, FaUser } from 'react-icons/fa';
import Image from 'next/image';
import ImageCropper from './ImageCropper';
import { validateImageFile, fileToDataURL, compressImage, blobToFile } from '@/lib/imageUtils';

interface ProfileImageProps {
  profileImageUrl?: string;
  onImageChange?: (file: File) => Promise<void>;
  isEditable?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  userName?: string;
}

const sizeClasses = {
  sm: 'w-20 h-20',
  md: 'w-28 h-28',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40'
};

const iconSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

export default function ProfileImage({
  profileImageUrl,
  onImageChange,
  isEditable = true,
  size = 'lg',
  className = '',
  userName
}: ProfileImageProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateImageFile(file, 10); // Max 10MB
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    try {
      // Convert to data URL for cropper
      const dataUrl = await fileToDataURL(file);
      setCropperImage(dataUrl);
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Failed to read image file');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle crop completion
  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setCropperImage(null);

    try {
      // Compress to <= 100KB (profile: max 300x300)
      const compressedBlob = await compressImage(
        blobToFile(croppedBlob, 'profile.jpg'),
        {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
          maxSizeKB: 100
        }
      );

      // Convert to File
      const finalFile = blobToFile(compressedBlob, `profile_${Date.now()}.jpg`);
      
      // Show preview
      const previewDataUrl = await fileToDataURL(finalFile);
      setPreviewUrl(previewDataUrl);

      // Upload if handler provided
      if (onImageChange) {
        await onImageChange(finalFile);
      }

      setError(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger file input click
  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || profileImageUrl;

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Profile Image Container */}
        <motion.div
          className={`${sizeClasses[size]} rounded-full border-4 border-white dark:border-gray-900 
                     bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl relative overflow-hidden`}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {/* Image */}
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={userName || 'Profile picture'}
              fill
              className="object-cover"
              priority
            />
          ) : (
            // Default avatar icon
            <div className="w-full h-full flex items-center justify-center">
              <FaUser className="text-white text-4xl opacity-80" />
            </div>
          )}

          {/* Upload Overlay */}
          {isEditable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered || isUploading ? 1 : 0 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
              onClick={handleEditClick}
            >
              {isUploading ? (
                <FaSpinner className="text-white text-2xl animate-spin" />
              ) : (
                <FaCamera className={`text-white ${iconSizes[size]}`} />
              )}
            </motion.div>
          )}

          {/* Loading Spinner */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <FaSpinner className="text-white text-xl animate-spin" />
                <span className="text-white text-xs font-medium">Uploading...</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Edit Icon Badge (bottom-right corner) */}
        {isEditable && !isUploading && (
          <motion.button
            onClick={handleEditClick}
            className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 rounded-full 
                     border-2 border-white dark:border-gray-900 shadow-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Edit profile picture"
          >
            <FaCamera className="text-white text-sm" />
          </motion.button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center"
        >
          {error}
        </motion.div>
      )}

      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          aspectRatio={1} // 1:1 ratio for profile (square)
          cropShape="round"
          title="Crop Profile Picture"
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperImage(null)}
        />
      )}
    </>
  );
}
