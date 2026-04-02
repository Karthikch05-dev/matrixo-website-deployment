'use client';

/**
 * ============================================================
 * INTERACTIVE DEMO PAGE
 * Test all profile components with live previews
 * ============================================================
 * 
 * To use:
 * Run: npm run dev
 * Visit: http://localhost:3000/profile-test
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ProfileCard, 
  CoverImage, 
  ProfileImage, 
  ImageUploader 
} from '@/components/profile';
import { FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

export default function ProfileTestPage() {
  const [profileData, setProfileData] = useState({
    name: 'Alex Johnson',
    username: 'alexj',
    bio: 'Senior Frontend Developer | React & TypeScript enthusiast | Building awesome UIs 🚀',
    location: 'San Francisco, CA',
    email: 'alex@example.com',
    website: 'https://alexjohnson.dev',
    profileImage: '',
    coverImage: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<{
    profile?: { name: string; size: number };
    cover?: { name: string; size: number };
    general?: { name: string; size: number };
  }>({});

  // Mock upload function (replace with real Firebase upload)
  const mockUpload = async (file: File, type: string) => {
    console.log(`📤 Uploading ${type}:`, {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type
    });

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Store file info
    setUploadedFiles(prev => ({
      ...prev,
      [type]: { name: file.name, size: file.size }
    }));

    // Return mock URL (in production, this would be from Firebase/S3)
    return URL.createObjectURL(file);
  };

  const handleProfileUpdate = async (updates: { profileImage?: string; coverImage?: string }) => {
    setProfileData(prev => ({ ...prev, ...updates }));
    console.log('✅ Profile updated:', updates);
  };

  const handleProfileImageChange = async (file: File) => {
    const url = await mockUpload(file, 'profile');
    setProfileData(prev => ({ ...prev, profileImage: url }));
  };

  const handleCoverImageChange = async (file: File) => {
    const url = await mockUpload(file, 'cover');
    setProfileData(prev => ({ ...prev, coverImage: url }));
  };

  const handleGeneralUpload = async (file: File) => {
    const url = await mockUpload(file, 'general');
    return url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Profile UI Test Suite
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Interactive demo of all profile components
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6"
        >
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-600 dark:text-blue-400 text-xl mt-1 flex-shrink-0" />
            <div className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold">How to test:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Click on cover image or profile picture to upload</li>
                <li>Crop images with drag & zoom controls</li>
                <li>Check browser console for upload logs</li>
                <li>All images auto-compress to ≤100KB</li>
                <li>Test on mobile for touch interactions</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Test 1: Complete Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              1. Complete Profile Card
            </h2>
            <span className="px-3 py-1 bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
              RECOMMENDED
            </span>
          </div>
          
          <ProfileCard
            user={profileData}
            isOwnProfile={true}
            onProfileUpdate={handleProfileUpdate}
          />
        </motion.div>

        {/* Test 2: Individual Components */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            2. Individual Components
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Cover Image Only */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">Cover Image</h3>
                <p className="text-xs text-gray-500">3:1 aspect ratio, auto-crop</p>
              </div>
              <CoverImage
                coverImageUrl={profileData.coverImage}
                onImageChange={handleCoverImageChange}
                isEditable={true}
              />
            </div>

            {/* Profile Image Only */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Profile Image</h3>
                <p className="text-xs text-gray-500">1:1 aspect ratio, circular</p>
              </div>
              <div className="flex justify-center">
                <ProfileImage
                  profileImageUrl={profileData.profileImage}
                  onImageChange={handleProfileImageChange}
                  isEditable={true}
                  size="xl"
                  userName={profileData.name}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Test 3: Standalone Uploader */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            3. Standalone Image Uploader
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* 3:1 Banner */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Banner (3:1)
              </h3>
              <ImageUploader
                aspectRatio={3}
                maxSizeKB={100}
                onUpload={handleGeneralUpload}
                label="Upload Banner"
                cropShape="rect"
              />
            </div>

            {/* Square */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Square (1:1)
              </h3>
              <ImageUploader
                aspectRatio={1}
                maxSizeKB={100}
                onUpload={handleGeneralUpload}
                label="Upload Square"
                cropShape="round"
              />
            </div>

            {/* Free Crop */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Free Crop
              </h3>
              <ImageUploader
                maxSizeKB={100}
                onUpload={handleGeneralUpload}
                label="Upload Any"
                maxWidth={800}
                maxHeight={800}
              />
            </div>
          </div>
        </motion.div>

        {/* Upload Stats */}
        {Object.keys(uploadedFiles).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6"
          >
            <div className="flex items-start gap-3">
              <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl mt-1 flex-shrink-0" />
              <div className="space-y-3 flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Upload Statistics (Check Console for Details)
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  {Object.entries(uploadedFiles).map(([type, file]) => (
                    <div key={type} className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                      <p className="font-medium text-green-900 dark:text-green-100 capitalize">
                        {type} Image
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ✨ Features Checklist
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              'Cover image with 3:1 ratio',
              'Circular profile overlapping cover',
              'Interactive crop with zoom',
              'Auto compression ≤100KB',
              'Drag & reposition images',
              'Mobile touch support',
              'Loading indicators',
              'Error handling',
              'Dark mode support',
              'Firebase ready',
              'TypeScript typed',
              'Responsive design'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <FaCheckCircle className="text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
