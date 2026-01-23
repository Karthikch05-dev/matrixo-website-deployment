// Firebase Configuration
// Replace these values with your actual Firebase project credentials
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAkxv3nLMJZyqivl1QP-cerSCsxSoLYtPQ",
  authDomain: "matrixo-in-auth.firebaseapp.com",
  projectId: "matrixo-in-auth",
  storageBucket: "matrixo-in-auth.firebasestorage.app",
  messagingSenderId: "431287252568",
  appId: "1:431287252568:web:0bdc2975d8951203bf7c2d",
  measurementId: "G-J18MTSRX3K"
};

// Initialize Firebase (avoid re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
export default app;
