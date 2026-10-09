import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { app } from './client';

// Cast keeps existing call sites working; guard usage with `firebaseReady`.
export const storage = (app ? getStorage(app) : null) as unknown as FirebaseStorage;
