// ============================================================
// Cover Image Component
// Banner/header image with edit functionality
// Responsive design with 3:1 aspect ratio
// ============================================================

'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCamera, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';
import ImageCropper from './ImageCropper';
import { validateImageFile, fileToDataURL, compressImage, blobToFile } from '@/lib/imageUtils';

interface CoverImageProps {
  coverImageUrl?: string;
  onImageChange?: (file: File) => Promise<void>;
  isEditable?: boolean;
  className?: string;
}

export default function CoverImage({
  coverImageUrl,
  onImageChange,
  isEditable = true,
  className = ''
}: CoverImageProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      // Compress to <= 100KB (cover: max 800x267)
      const compressedBlob = await compressImage(
        blobToFile(croppedBlob, 'cover.jpg'),
        {
          maxWidth: 1200,
          maxHeight: 400,
          quality: 0.7,
          maxSizeKB: 100
        }
      );

      // Convert to File
      const finalFile = blobToFile(compressedBlob, `cover_${Date.now()}.jpg`);
      
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

  const displayUrl = previewUrl || coverImageUrl;

  return (
    <>
      <div className={`relative w-full bg-gradient-to-r from-blue-600 to-purple-600 ${className}`}>
        {/* Cover Image */}
        <div className="relative w-full aspect-[3/1] overflow-hidden">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Cover image"
              fill
              className="object-cover"
              priority
            />
          ) : (
            // Default gradient background
            <div className="w-full h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
          )}

          {/* Upload overlay (visible on hover) */}
          {isEditable && (
            <motion.div
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={handleEditClick}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <FaSpinner className="text-white text-3xl animate-spin" />
                  <span className="text-white text-sm font-medium">Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
                    <FaCamera className="text-white text-2xl" />
                  </div>
                  <span className="text-white text-sm font-medium">Change Cover</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Edit Button (top-right corner) */}
          {isEditable && !isUploading && (
            <button
              onClick={handleEditClick}
              className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm 
                       rounded-xl transition-colors group"
              aria-label="Edit cover image"
            >
              <FaCamera className="text-white text-lg" />
            </button>
          )}
        </div>

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
          className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          aspectRatio={3} // 3:1 ratio for cover
          cropShape="rect"
          title="Crop Cover Image"
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperImage(null)}
        />
      )}
    </>
  );
}
