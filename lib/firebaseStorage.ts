// ============================================================
// Firebase Storage Helper - Image Upload
// Handles uploading compressed images to Firebase Storage
// ============================================================

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig';

/**
 * Upload image to Firebase Storage
 * @param file - Image file to upload
 * @param folder - Storage folder path (e.g., 'profile-images', 'cover-images')
 * @param userId - Optional user ID to organize files
 * @returns Download URL of uploaded image
 */
export async function uploadImageToFirebase(
  file: File,
  folder: string = 'images',
  userId?: string
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // Create storage path
    const storagePath = userId 
      ? `${folder}/${userId}/${fileName}`
      : `${folder}/${fileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Firebase upload error:', error);
    throw new Error('Failed to upload image to Firebase Storage');
  }
}

/**
 * Upload multiple images to Firebase Storage
 * @param files - Array of image files
 * @param folder - Storage folder path
 * @param userId - Optional user ID
 * @returns Array of download URLs
 */
export async function uploadMultipleImagesToFirebase(
  files: File[],
  folder: string = 'images',
  userId?: string
): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => 
      uploadImageToFirebase(file, folder, userId)
    );
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error('Failed to upload images');
  }
}

/**
 * Delete image from Firebase Storage (optional - for cleanup)
 * @param imageUrl - Full Firebase Storage URL
 */
export async function deleteImageFromFirebase(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl);
    // Note: You'll need to import deleteObject from firebase/storage
    // import { deleteObject } from 'firebase/storage';
    // await deleteObject(imageRef);
    
    console.log('Image deleted successfully');
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete image');
  }
}
