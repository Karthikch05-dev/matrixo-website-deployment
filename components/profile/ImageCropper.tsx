// ============================================================
// Image Cropper Component
// Interactive image cropping with drag, zoom, and live preview
// Supports both square (profile) and rectangular (cover) crops
// ============================================================

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { createCroppedImage } from '@/lib/imageUtils';

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio: number; // 1 for square (profile), 3 for cover (3:1)
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  cropShape?: 'rect' | 'round';
  title?: string;
}

export default function ImageCropper({
  imageSrc,
  aspectRatio,
  onCropComplete,
  onCancel,
  cropShape = 'rect',
  title = 'Crop Image'
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const point = 'touches' in e ? e.touches[0] : e;
    setDragStart({
      x: point.clientX - position.x,
      y: point.clientY - position.y
    });
  };

  // Handle drag move
  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const point = 'touches' in e ? e.touches[0] : e;
    setPosition({
      x: point.clientX - dragStart.x,
      y: point.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach/detach event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate and execute crop
  const handleCrop = async () => {
    if (!containerRef.current || !imageRef.current) return;
    
    setIsProcessing(true);
    
    try {
      const container = containerRef.current;
      const image = imageRef.current;
      
      // Get container and image dimensions
      const containerRect = container.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      
      // Calculate crop window size
      const cropWidth = Math.min(containerRect.width * 0.8, 600);
      const cropHeight = cropWidth / aspectRatio;
      
      // Calculate crop area in image coordinates
      const scaleX = image.naturalWidth / imageRect.width;
      const scaleY = image.naturalHeight / imageRect.height;
      
      const cropX = ((containerRect.width - cropWidth) / 2 - position.x) * scaleX;
      const cropY = ((containerRect.height - cropHeight) / 2 - position.y) * scaleY;
      
      const cropArea = {
        x: Math.max(0, cropX),
        y: Math.max(0, cropY),
        width: cropWidth * scaleX,
        height: cropHeight * scaleY
      };

      // Create cropped image
      const croppedBlob = await createCroppedImage(imageSrc, cropArea);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('Crop failed:', error);
      alert('Failed to crop image. Please try again.');
      setIsProcessing(false);
    }
  };

  // Prevent body scroll when cropper is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Cancel"
          >
            <FaTimes className="text-white" />
          </button>
        </div>

        {/* Crop Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden touch-none"
        >
          {/* Image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              className="max-w-none select-none"
              draggable={false}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            />
          </div>

          {/* Crop Overlay */}
          <CropOverlay aspectRatio={aspectRatio} cropShape={cropShape} />
        </div>

        {/* Controls */}
        <div className="p-4 md:p-6 bg-gray-900/50 backdrop-blur-sm border-t border-gray-800 space-y-4">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3 md:gap-4">
            <FaSearchMinus className="text-gray-400 text-sm md:text-base" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none 
                       [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 
                       [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-blue-500 
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-moz-range-thumb]:w-4 
                       [&::-moz-range-thumb]:h-4 
                       [&::-moz-range-thumb]:rounded-full 
                       [&::-moz-range-thumb]:bg-blue-500 
                       [&::-moz-range-thumb]:border-0
                       [&::-moz-range-thumb]:cursor-pointer"
            />
            <FaSearchPlus className="text-gray-400 text-sm md:text-base" />
            <span className="text-sm text-gray-400 w-10 text-right">{zoom.toFixed(1)}x</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl 
                       transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl 
                       transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Processing...</span>
                </>
              ) : (
                <>
                  <FaCheck />
                  <span className="hidden sm:inline">Apply Crop</span>
                  <span className="sm:hidden">Apply</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Crop overlay component
function CropOverlay({ aspectRatio, cropShape }: { aspectRatio: number; cropShape: 'rect' | 'round' }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full">
        <defs>
          <mask id="cropMask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x="10%"
              y="50%"
              width="80%"
              height={`${80 / aspectRatio}%`}
              transform={`translate(0, -${40 / aspectRatio}%)`}
              rx={cropShape === 'round' ? '50%' : '8'}
              fill="black"
            />
          </mask>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="black" 
          fillOpacity="0.6" 
          mask="url(#cropMask)" 
        />
        
        {/* Crop border */}
        <rect
          x="10%"
          y="50%"
          width="80%"
          height={`${80 / aspectRatio}%`}
          transform={`translate(0, -${40 / aspectRatio}%)`}
          rx={cropShape === 'round' ? '50%' : '8'}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}
