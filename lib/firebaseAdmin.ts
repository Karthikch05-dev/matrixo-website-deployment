import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let adminApp: App | null = null;

const stripSurroundingQuotes = (value: string) => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const normalizePrivateKey = (key: string) =>
  stripSurroundingQuotes(key).replace(/\\n/g, "\n").trim();

function validateServiceAccount(
  serviceAccount: Partial<ServiceAccountJson>,
  source: string,
): ServiceAccountJson {
  const missing = (
    ["project_id", "client_email", "private_key"] as const
  ).filter((key) => !serviceAccount[key]);

  if (missing.length > 0) {
    throw new Error(
      `Firebase Admin service account (${source}) is missing required field(s): ${missing.join(", ")}. ` +
        "Make sure you copied the *service account* JSON (Firebase Console > Project Settings > " +
        "Service Accounts > Generate new private key), not the client-side web config.",
    );
  }

  const privateKey = normalizePrivateKey(serviceAccount.private_key as string);
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      `Firebase Admin service account (${source}) has a malformed private_key. ` +
        "If this was set via a Vercel env var, make sure newlines are preserved (either paste the raw " +
        'multi-line key, or keep the escaped "\\n" sequences intact) and that the value is not wrapped ' +
        "in extra quotes.",
    );
  }

  return {
    project_id: serviceAccount.project_id as string,
    client_email: serviceAccount.client_email as string,
    private_key: privateKey,
  };
}

function loadServiceAccount(): ServiceAccountJson {
  // Preferred for Vercel: three separate env vars avoid JSON/escaping issues entirely.
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return validateServiceAccount(
      {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY,
      },
      "FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars",
    );
  }

  const candidatePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    path.resolve(process.cwd(), "serviceAccountKey.json"),
    path.resolve(process.cwd(), "..", "serviceAccountKey.json"),
  ].filter(Boolean) as string[];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, "utf8");
      const parsed = JSON.parse(raw) as Partial<ServiceAccountJson>;
      return validateServiceAccount(parsed, candidate);
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    let parsed: Partial<ServiceAccountJson>;
    try {
      parsed = JSON.parse(
        stripSurroundingQuotes(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
      );
    } catch (err) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Paste the entire contents of the service " +
          "account key file exactly as downloaded from Firebase Console.",
      );
    }
    return validateServiceAccount(
      parsed,
      "FIREBASE_SERVICE_ACCOUNT_JSON env var",
    );
  }

  throw new Error(
    "Firebase Admin service account not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and " +
      "FIREBASE_PRIVATE_KEY (recommended), or FIREBASE_SERVICE_ACCOUNT_JSON, in your environment.",
  );
}

export function getAdminApp() {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccount = loadServiceAccount();
  adminApp = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });

  return adminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
