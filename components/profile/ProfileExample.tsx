// ============================================================
// Example Usage Page
// Demonstrates how to use the Profile Card components
// ============================================================

'use client';

import { useState } from 'react';
import ProfileCard from '@/components/profile/ProfileCard';

export default function ProfileExamplePage() {
  // Example user data (replace with real data from your auth/database)
  const [userData, setUserData] = useState({
    name: 'John Doe',
    username: 'johndoe',
    bio: 'Full-stack developer passionate about building amazing web experiences. Tech enthusiast and coffee lover ☕',
    location: 'San Francisco, CA',
    email: 'john@example.com',
    website: 'https://johndoe.dev',
    profileImage: '', // Will use default avatar initially
    coverImage: '' // Will use default gradient initially
  });

  // Handle profile updates
  const handleProfileUpdate = async (updates: { profileImage?: string; coverImage?: string }) => {
    setUserData(prev => ({
      ...prev,
      ...updates
    }));

    // Here you would also update the database
    console.log('Profile updated:', updates);
    
    // Example: Update Firestore
    // await updateDoc(doc(db, 'users', userId), updates);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold gradient-text">
            Profile Card Example
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Click on cover or profile image to upload and crop
          </p>
        </div>

        {/* Profile Card */}
        <ProfileCard
          user={userData}
          isOwnProfile={true}
          onProfileUpdate={handleProfileUpdate}
        />

        {/* Features Info */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ✨ Features Included
          </h2>
          <ul className="grid md:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Responsive cover image (3:1 aspect ratio)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Circular profile picture overlapping cover</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Interactive image cropping with zoom/drag</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Auto compression to ≤ 100KB (optimized)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>JPEG conversion for best compression</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Smooth hover effects and animations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Loading states and error handling</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Mobile-responsive design</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Firebase Storage integration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Dark mode support</span>
            </li>
          </ul>
        </div>

        {/* Implementation Notes */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📝 Implementation Notes
          </h2>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                File Structure:
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">components/profile/ProfileCard.tsx</code> - Main profile card</li>
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">components/profile/CoverImage.tsx</code> - Cover/banner component</li>
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">components/profile/ProfileImage.tsx</code> - Profile photo component</li>
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">components/profile/ImageCropper.tsx</code> - Cropping modal</li>
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">lib/imageUtils.ts</code> - Compression utilities</li>
                <li><code className="bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">lib/firebaseStorage.ts</code> - Upload helpers</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Customization:
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Adjust compression targets in <code className="bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">maxSizeKB</code> parameter</li>
                <li>Change aspect ratios via <code className="bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">aspectRatio</code> prop</li>
                <li>Modify profile sizes: 'sm', 'md', 'lg', 'xl'</li>
                <li>Replace Firebase with your storage solution</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Image Specs:
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Cover: Max 1200x400px, compressed to ≤100KB</li>
                <li>Profile: Max 400x400px, compressed to ≤100KB</li>
                <li>Format: JPEG (best compression)</li>
                <li>Quality: Auto-adjusted (0.1-0.95) to meet size target</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
