/**
 * Firebase setup module - Delegating to main Firebase module
 * This file is a bridge to maintain backward compatibility with code importing from lib/firebase
 */
export { app, auth, db, storage } from '../firebase';

// Re-export auth helper from the proper location
export { getAuthToken } from './auth';