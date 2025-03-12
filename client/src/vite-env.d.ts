/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_FIREBASE_CONFIG_API_KEY: string;
  readonly VITE_FIREBASE_CONFIG_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_CONFIG_PROJECT_ID: string;
  readonly VITE_FIREBASE_CONFIG_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_CONFIG_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_CONFIG_APP_ID: string;
  readonly VITE_FAL_API_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  // más variables de entorno...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}