import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const readEnv = (key: string) => process.env[key]?.trim() || '';

const hostName = typeof window !== 'undefined' ? window.location.hostname : '';

const isBetaDeployment =
  hostName === 'beta.matrixo.in' ||
  process.env.NEXT_PUBLIC_SITE_MODE === 'beta' ||
  process.env.NEXT_PUBLIC_SITE_URL === 'https://beta.matrixo.in' ||
  process.env.NEXT_PUBLIC_VERCEL_URL?.includes('beta') === true;

const pickFirebaseEnv = (baseKey: string) => {
  const betaKey = `${baseKey}_BETA`;
  const mainKey = `${baseKey}_MAIN`;

  if (isBetaDeployment) {
    return readEnv(betaKey) || readEnv(baseKey) || readEnv(mainKey);
  }

  return readEnv(mainKey) || readEnv(baseKey) || readEnv(betaKey);
};

const firebaseConfig = {
  apiKey: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  measurementId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID')
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
