import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type Auth,
} from 'firebase/auth';

/*
 * Firebase app + Auth only. This is the one Firebase module the site shell
 * loads on every page, so it deliberately does NOT pull in Firestore or
 * Storage — those live in ./db and ./storage and load with the pages that
 * need them.
 */

type FirebaseBaseEnvKey =
  | 'NEXT_PUBLIC_FIREBASE_API_KEY'
  | 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'
  | 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  | 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'
  | 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
  | 'NEXT_PUBLIC_FIREBASE_APP_ID'
  | 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID';

type FirebaseEnvKey = FirebaseBaseEnvKey | `${FirebaseBaseEnvKey}_BETA` | `${FirebaseBaseEnvKey}_MAIN`;

// IMPORTANT: These are Firebase public web config values, not secrets.
// We keep a known-good fallback so the site can still boot if deployment env
// variables are missing or accidentally deployed as placeholders.
// Env vars still win when present, including *_MAIN / *_BETA variants.
const fallbackFirebaseConfig = {
  apiKey: 'AIzaSyAkxv3nLMJZyqivl1QP-cerSCsxSoLYtPQ',
  authDomain: 'matrixo-in-auth.firebaseapp.com',
  projectId: 'matrixo-in-auth',
  storageBucket: 'matrixo-in-auth.firebasestorage.app',
  messagingSenderId: '431287252568',
  appId: '1:431287252568:web:0bdc2975d8951203bf7c2d',
  measurementId: 'G-J18MTSRX3K'
} as const;


const stripSurroundingQuotes = (value: string) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }

  return value;
};

const readEnv = (key: string) => stripSurroundingQuotes(process.env[key]?.trim() || '');

const isPlaceholderValue = (value: string) => {
  const normalizedValue = value.toLowerCase();
  return (
    normalizedValue === '' ||
    normalizedValue.startsWith('your_') ||
    normalizedValue.includes('replace') ||
    normalizedValue.includes('changeme')
  );
};

const normalizeFirebaseEnvKey = (key: FirebaseEnvKey): FirebaseBaseEnvKey => {
  if (key.endsWith('_BETA') || key.endsWith('_MAIN')) {
    return key.slice(0, -5) as FirebaseBaseEnvKey;
  }
  return key as FirebaseBaseEnvKey;
};

const normalizeFirebaseValue = (key: FirebaseBaseEnvKey, value: string) => {
  switch (key) {
    case 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN':
    case 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET':
      return value.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    default:
      return value;
  }
};

const isValidFirebaseValue = (key: FirebaseBaseEnvKey, value: string) => {
  switch (key) {
    case 'NEXT_PUBLIC_FIREBASE_API_KEY':
      return /^AIza[0-9A-Za-z_-]{20,}$/.test(value);
    case 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN':
      return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
    case 'NEXT_PUBLIC_FIREBASE_PROJECT_ID':
      return /^[a-z0-9-]{4,}$/i.test(value);
    case 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET':
      return /^[a-z0-9.-]+(\.appspot\.com|\.firebasestorage\.app)$/i.test(value);
    case 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID':
      return /^\d{6,}$/.test(value);
    case 'NEXT_PUBLIC_FIREBASE_APP_ID':
      return /^\d+:\d+:web:[a-z0-9]+$/i.test(value);
    case 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID':
      return /^G-[A-Z0-9]+$/i.test(value);
    default:
      return false;
  }
};

const readFirebaseEnv = (key: FirebaseEnvKey) => {
  const normalizedKey = normalizeFirebaseEnvKey(key);
  const value = normalizeFirebaseValue(normalizedKey, readEnv(key));

  if (isPlaceholderValue(value)) {
    return '';
  }

  return isValidFirebaseValue(normalizedKey, value) ? value : '';
};

const hostName = typeof window !== 'undefined' ? window.location.hostname : '';

const isBetaDeployment =
  hostName === 'beta.matrixo.in' ||
  process.env.NEXT_PUBLIC_SITE_MODE === 'beta' ||
  process.env.NEXT_PUBLIC_SITE_URL === 'https://beta.matrixo.in' ||
  process.env.NEXT_PUBLIC_VERCEL_URL?.includes('beta') === true;

const pickFirebaseEnv = (baseKey: FirebaseBaseEnvKey, fallbackValue: string) => {
  const betaKey = `${baseKey}_BETA` as FirebaseEnvKey;
  const mainKey = `${baseKey}_MAIN` as FirebaseEnvKey;
  const baseValue = readFirebaseEnv(baseKey);
  const betaValue = readFirebaseEnv(betaKey);
  const mainValue = readFirebaseEnv(mainKey);

  if (isBetaDeployment) {
    return betaValue || baseValue || mainValue || fallbackValue;
  }

  return mainValue || baseValue || betaValue || fallbackValue;
};

const firebaseConfig = {
  apiKey: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_API_KEY', fallbackFirebaseConfig.apiKey),
  authDomain: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', fallbackFirebaseConfig.authDomain),
  projectId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', fallbackFirebaseConfig.projectId),
  storageBucket: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', fallbackFirebaseConfig.storageBucket),
  messagingSenderId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', fallbackFirebaseConfig.messagingSenderId),
  appId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_APP_ID', fallbackFirebaseConfig.appId),
  measurementId: pickFirebaseEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', fallbackFirebaseConfig.measurementId)
};

const requiredFirebaseConfigKeys: Array<keyof typeof firebaseConfig> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
];

const missingKeys = requiredFirebaseConfigKeys.filter((k) => !firebaseConfig[k]);

if (missingKeys.length > 0) {
  // Warn but do not throw — missing env vars should not hard-crash the site.
  // Features that rely on Firebase will be disabled until env vars are set.
  const globalScope = globalThis as typeof globalThis & { __firebaseConfigWarned?: boolean }
  if (!globalScope.__firebaseConfigWarned) {
    globalScope.__firebaseConfigWarned = true
    // eslint-disable-next-line no-console
    console.warn(
      `[firebaseConfig] Missing required env vars for Firebase (${missingKeys.join(', ')}). ` +
        'Set NEXT_PUBLIC_FIREBASE_* env vars (and the *_BETA variants if deploying to beta).'
    );
  }
}

export const firebaseReady = missingKeys.length === 0;

export const app: FirebaseApp | null = firebaseReady
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

/**
 * In the browser, Auth is initialised WITHOUT a popup/redirect resolver.
 * `getAuth()` would attach one, and that resolver eagerly loads Google's
 * auth iframe (~95 KB, plus a project-config request) on every page view
 * just in case someone signs in with Google. AuthContext passes the resolver
 * explicitly to the popup/redirect calls instead, so the iframe only loads
 * when a visitor actually clicks "Continue with Google".
 */
function createAuth(firebaseApp: FirebaseApp): Auth {
  if (typeof window === 'undefined') return getAuth(firebaseApp);
  try {
    return initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
    });
  } catch {
    // Already initialised (fast refresh, or a second import path).
    return getAuth(firebaseApp);
  }
}

// Cast keeps existing call sites working; guard usage with `firebaseReady`.
export const auth = (app ? createAuth(app) : null) as unknown as Auth;

export { firebaseConfig };
