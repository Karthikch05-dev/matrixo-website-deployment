import { getFirestore, type Firestore } from 'firebase/firestore';
import { app } from './client';

// Cast keeps existing call sites working; guard usage with `firebaseReady`.
export const db = (app ? getFirestore(app) : null) as unknown as Firestore;
