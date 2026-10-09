// ============================================================
// Complete Profile Card Component
// Combines Cover + Profile Image with user info
// Production-ready example implementation
// ============================================================

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaEnvelope, FaGlobe, FaCheck } from 'react-icons/fa';
import CoverImage from './CoverImage';
import ProfileImage from './ProfileImage';
import { uploadImageToFirebase } from '@/lib/firebaseStorage';

interface ProfileCardProps {
  user: {
    name: string;
    username: string;
    bio?: string;
    location?: string;
    email?: string;
    website?: string;
    profileImage?: string;
    coverImage?: string;
  };
  isOwnProfile?: boolean;
  onProfileUpdate?: (updates: { profileImage?: string; coverImage?: string }) => void;
}

export default function ProfileCard({ 
  user, 
  isOwnProfile = false,
  onProfileUpdate 
}: ProfileCardProps) {
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'profile' | 'cover' | null;
    message: string;
  } | null>(null);

  // Handle profile image upload
  const handleProfileImageChange = async (file: File) => {
    setUploadStatus({ type: 'profile', message: 'Uploading profile image...' });
    
    try {
      // Upload to Firebase Storage (you can replace with your upload logic)
      const imageUrl = await uploadImageToFirebase(file, 'profile-images');
      
      // Update user profile
      onProfileUpdate?.({ profileImage: imageUrl });
      
      setUploadStatus({ type: 'profile', message: 'Profile image updated!' });
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('Profile image upload failed:', error);
      setUploadStatus({ type: 'profile', message: 'Upload failed. Please try again.' });
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  // Handle cover image upload
  const handleCoverImageChange = async (file: File) => {
    setUploadStatus({ type: 'cover', message: 'Uploading cover image...' });
    
    try {
      // Upload to Firebase Storage (you can replace with your upload logic)
      const imageUrl = await uploadImageToFirebase(file, 'cover-images');
      
      // Update user profile
      onProfileUpdate?.({ coverImage: imageUrl });
      
      setUploadStatus({ type: 'cover', message: 'Cover image updated!' });
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('Cover image upload failed:', error);
      setUploadStatus({ type: 'cover', message: 'Upload failed. Please try again.' });
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Status Toast */}
      {uploadStatus && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl 
                   border border-gray-200 dark:border-gray-700 flex items-center gap-3"
        >
          <FaCheck className="text-green-500" />
          <span className="text-gray-900 dark:text-white font-medium">{uploadStatus.message}</span>
        </motion.div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Cover Image */}
        <CoverImage
          coverImageUrl={user.coverImage}
          onImageChange={isOwnProfile ? handleCoverImageChange : undefined}
          isEditable={isOwnProfile}
        />

        {/* Profile Section */}
        <div className="relative px-6 pb-6">
          {/* Profile Image (overlapping cover) */}
          <div className="flex justify-between items-end -mt-16 mb-4">
            <ProfileImage
              profileImageUrl={user.profileImage}
              onImageChange={isOwnProfile ? handleProfileImageChange : undefined}
              isEditable={isOwnProfile}
              size="xl"
              userName={user.name}
            />

            {isOwnProfile && (
              <button className="btn-primary px-6 py-2 rounded-xl font-medium">
                Edit Profile
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-3">
            {/* Name & Username */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {user.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base">
                {user.bio}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              {user.location && (
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.email && (
                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-gray-400" />
                  <span>{user.email}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center gap-2">
                  <FaGlobe className="text-gray-400" />
                  <a 
                    href={user.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
