import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the service account credentials from the JSON file
const serviceAccountPath = join(__dirname, '..', 'attached_assets', 'artist-boost-firebase-adminsdk-fbsvc-cb627d3f73.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

export const db = getFirestore(app);
export const auth = getAuth(app);

// Configurar las reglas de seguridad de Firestore
const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /spotify_data/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
`;