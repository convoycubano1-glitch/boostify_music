import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the service account credentials from the JSON file
const serviceAccountPath = join(__dirname, '..', 'attached_assets', 'artist-boost-firebase-adminsdk-fbsvc-cb627d3f73.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Configure Firestore security rules
const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /spotify_data/{userId} {
      allow read, write: if request.auth != null;
    }
    match /campaigns/{documentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /marketing_metrics/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /contacts/{contactId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /courses/{courseId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }
    match /course_progress/{progressId} {
      allow read: if request.auth != null && progressId.matches(request.auth.uid + '_.*');
      allow write: if request.auth != null && progressId.matches(request.auth.uid + '_.*');
    }
    match /investors/{investorId} {
      // Simplify rules for development
      allow read, write: if request.auth != null;
    }
    // New collections for the social network
    match /social_users/{userId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /social_posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    match /social_comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
  }
}
`;

// Configure Storage security rules
const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow public read access to all files
      allow read: if true;

      // Only allow write access to authenticated users
      allow write: if request.auth != null;
    }
  }
}
`;

export const firebaseAdmin = app;