import { z } from "zod";

const envSchema = z.object({
  VITE_OPENROUTER_API_KEY: z.string().optional(),
  VITE_FIREBASE_API_KEY: z.string().min(1, "Firebase API Key is required"),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1, "Firebase Auth Domain is required"),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, "Firebase Project ID is required"),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1, "Firebase Storage Bucket is required"),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, "Firebase Messaging Sender ID is required"),
  VITE_FIREBASE_APP_ID: z.string().min(1, "Firebase App ID is required"),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

function getEnvVar(key: string): string {
  const value = import.meta.env[key] || process.env[key];
  if (!value) {
    console.error(`Environment variable ${key} is not set`);
    return '';
  }
  return value;
}

// Parse environment variables with fallback values
export const env = envSchema.parse({
  VITE_OPENROUTER_API_KEY: getEnvVar('VITE_OPENROUTER_API_KEY'),
  VITE_FIREBASE_API_KEY: getEnvVar('VITE_FIREBASE_API_KEY'),
  VITE_FIREBASE_AUTH_DOMAIN: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  VITE_FIREBASE_PROJECT_ID: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  VITE_FIREBASE_STORAGE_BUCKET: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  VITE_FIREBASE_MESSAGING_SENDER_ID: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  VITE_FIREBASE_APP_ID: getEnvVar('VITE_FIREBASE_APP_ID'),
  VITE_FIREBASE_MEASUREMENT_ID: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
});

// Export Firebase configuration
export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  ...(env.VITE_FIREBASE_MEASUREMENT_ID && { measurementId: env.VITE_FIREBASE_MEASUREMENT_ID }),
};

// Log config for debugging (hiding sensitive values)
console.log('Firebase config loaded:', {
  ...FIREBASE_CONFIG,
  apiKey: '[HIDDEN]'
});