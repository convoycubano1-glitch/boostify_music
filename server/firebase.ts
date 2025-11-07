import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let app: any;
let db: any;
let auth: any;
let storage: any;

// Initialize Firebase Admin with robust error handling
try {
  console.log("Initializing Firebase Admin...");
  
  app = initializeApp({
    // No credential provided, will use application default credentials or run in limited mode
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "artist-boost",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "artist-boost.firebasestorage.app"
  });

  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  
  console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
  console.warn("⚠️ Firebase Admin initialization failed (non-critical):", error instanceof Error ? error.message : error);
  console.warn("⚠️ Firebase features will be limited or unavailable");
  
  // Create mock objects to prevent crashes
  db = null;
  auth = null;
  storage = null;
}

export { db, auth, storage, FieldValue };

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