// ============================================================
// Standalone Image Uploader Component
// General-purpose uploader with compression & cropping
// Can be used independently for any image upload needs
// ============================================================

'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaUpload, FaSpinner, FaTimes, FaImage } from 'react-icons/fa';
import ImageCropper from './ImageCropper';
import { 
  validateImageFile, 
  fileToDataURL, 
  compressImage, 
  blobToFile 
} from '@/lib/imageUtils';

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<string>; // Returns image URL
  aspectRatio?: number; // Crop aspect ratio (default: free crop)
  maxSizeKB?: number; // Max compressed size in KB (default: 100)
  cropShape?: 'rect' | 'round';
  label?: string;
  existingImage?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export default function ImageUploader({
  onUpload,
  aspectRatio,
  maxSizeKB = 100,
  cropShape = 'rect',
  label = 'Upload Image',
  existingImage,
  maxWidth = 1200,
  maxHeight = 1200
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(existingImage || null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validationError = validateImageFile(file, 10);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    try {
      const dataUrl = await fileToDataURL(file);
      
      if (aspectRatio) {
        // Show cropper if aspect ratio specified
        setCropperImage(dataUrl);
      } else {
        // Direct upload (no crop)
        await handleDirectUpload(file);
      }
    } catch (err) {
      console.error('File read error:', err);
      setError('Failed to read image file');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Direct upload without cropping
  const handleDirectUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(30);

    try {
      // Compress
      const compressedBlob = await compressImage(file, {
        maxWidth,
        maxHeight,
        quality: 0.7,
        maxSizeKB
      });

      setUploadProgress(60);

      const finalFile = blobToFile(compressedBlob, `image_${Date.now()}.jpg`);
      
      // Preview
      const previewUrl = await fileToDataURL(finalFile);
      setPreview(previewUrl);

      setUploadProgress(80);

      // Upload
      const url = await onUpload(finalFile);
      
      setUploadProgress(100);
      console.log('Upload successful:', url);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
      setPreview(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle crop completion
  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setCropperImage(null);
    setUploadProgress(30);

    try {
      // Compress
      const compressedBlob = await compressImage(
        blobToFile(croppedBlob, 'temp.jpg'),
        {
          maxWidth,
          maxHeight,
          quality: 0.7,
          maxSizeKB
        }
      );

      setUploadProgress(60);

      const finalFile = blobToFile(compressedBlob, `image_${Date.now()}.jpg`);
      
      // Preview
      const previewUrl = await fileToDataURL(finalFile);
      setPreview(previewUrl);

      setUploadProgress(80);

      // Upload
      const url = await onUpload(finalFile);
      
      setUploadProgress(100);
      console.log('Upload successful:', url);

    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
      setPreview(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Remove image
  const handleRemove = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div className="relative">
        {preview ? (
          // Preview with remove button
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl border-2 border-gray-300 dark:border-gray-700"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
                          transition-opacity rounded-xl flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                disabled={isUploading}
              >
                <FaImage className="text-white" />
              </button>
              <button
                onClick={handleRemove}
                className="p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                disabled={isUploading}
              >
                <FaTimes className="text-white" />
              </button>
            </div>
          </div>
        ) : (
          // Upload button
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 
                     rounded-xl hover:border-blue-500 transition-colors flex flex-col items-center 
                     justify-center gap-3 bg-gray-50 dark:bg-gray-900 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <FaSpinner className="text-3xl text-blue-500 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading... {uploadProgress}%
                </span>
              </>
            ) : (
              <>
                <FaUpload className="text-3xl text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {label}
                </span>
                <span className="text-xs text-gray-500">
                  Max 10MB • Auto-compressed to {maxSizeKB}KB
                </span>
              </>
            )}
          </button>
        )}

        {/* Progress Bar */}
        {isUploading && uploadProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 rounded-b-xl overflow-hidden">
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Hidden input */}
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
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {aspectRatio ? (
          <p>Image will be cropped to {aspectRatio}:1 aspect ratio</p>
        ) : (
          <p>Original aspect ratio will be preserved</p>
        )}
      </div>

      {/* Cropper Modal */}
      {cropperImage && aspectRatio && (
        <ImageCropper
          imageSrc={cropperImage}
          aspectRatio={aspectRatio}
          cropShape={cropShape}
          title={`Crop Image (${aspectRatio}:1)`}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperImage(null)}
        />
      )}
    </div>
  );
}
