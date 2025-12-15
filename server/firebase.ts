import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

let app: any;
let db: any;
let auth: any;
let storage: any;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }

  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: `${projectId}.firebasestorage.app`
  });

  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);

  console.log('✅ Firebase Admin SDK initialized successfully');
  console.log('✅ Firestore, Auth, and Storage ready');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error);
  console.log('⚠️ Firebase Admin deshabilitado - usando modo cliente solamente');
  
  db = null;
  auth = null;
  storage = null;
  app = null;
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

export const firebaseAdmin = app || null;