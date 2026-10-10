/*
 * Backwards-compatible entry point. Pages that need Firestore or Storage keep
 * importing from here; the site shell imports only `@/lib/firebase/client`
 * so those SDKs stay out of the bundle every page loads.
 */
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { app, auth, firebaseReady } from './firebase/client';
import { db } from './firebase/db';
import { storage } from './firebase/storage';

export { auth, db, storage, firebaseReady };
export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
export default app;
