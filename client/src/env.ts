import { z } from "zod";

const envSchema = z.object({
  VITE_OPENROUTER_API_KEY: z.string().optional(),
  VITE_FIREBASE_API_KEY: z.string().default("AIzaSyCEiY4InxiGpJrKJm1b0kl2YS-3-2IgIWI"),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().default("artist-boost.firebaseapp.com"),
  VITE_FIREBASE_PROJECT_ID: z.string().default("artist-boost"),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().default("artist-boost.appspot.com"),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().default("114213694920"),
  VITE_FIREBASE_APP_ID: z.string().default("1:114213694920:web:3b6b9b4b9b9b4b9b9b9b4b"),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().default("G-ERCSSWTXCJ"),
});

// Parse environment variables with fallback values
export const env = envSchema.parse({
  VITE_OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY,
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

// Export individual environment variables with type safety
export const OPENROUTER_API_KEY = env.VITE_OPENROUTER_API_KEY;
export const FIREBASE_CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};