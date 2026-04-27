import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const defaultFirebaseConfig = {
  apiKey: "AIzaSyAkxv3nLMJZyqivl1QP-cerSCsxSoLYtPQ",
  authDomain: "matrixo-in-auth.firebaseapp.com",
  projectId: "matrixo-in-auth",
  storageBucket: "matrixo-in-auth.firebasestorage.app",
  messagingSenderId: "431287252568",
  appId: "1:431287252568:web:0bdc2975d8951203bf7c2d",
  measurementId: "G-J18MTSRX3K"
};

const isBetaDeployment =
  process.env.NEXT_PUBLIC_SITE_MODE === 'beta' ||
  process.env.NEXT_PUBLIC_SITE_URL === 'https://beta.matrixo.in' ||
  process.env.NEXT_PUBLIC_VERCEL_URL?.includes('beta') === true;

const pickFirebaseEnv = (betaKey: string, defaultKey: string, fallback: string) => {
  if (isBetaDeployment && process.env[betaKey]) {
    return process.env[betaKey] as string;
  }
  return process.env[defaultKey] || fallback;
};

const firebaseConfig = {
  apiKey: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_API_KEY_BETA', 'NEXT_PUBLIC_FIREBASE_API_KEY', defaultFirebaseConfig.apiKey),
  authDomain: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_BETA', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', defaultFirebaseConfig.authDomain),
  projectId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID_BETA', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', defaultFirebaseConfig.projectId),
  storageBucket: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_BETA', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', defaultFirebaseConfig.storageBucket),
  messagingSenderId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_BETA', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', defaultFirebaseConfig.messagingSenderId),
  appId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_APP_ID_BETA', 'NEXT_PUBLIC_FIREBASE_APP_ID', defaultFirebaseConfig.appId),
  measurementId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_BETA', 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', defaultFirebaseConfig.measurementId)
};

// Initialize Firebase (avoid re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firestore
export const db = getFirestore(app);

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
export default app;
