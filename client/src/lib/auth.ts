import { auth } from '@/firebase';

/**
 * Retrieves the current Firebase authentication token
 * @returns Promise with the token string or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }
    
    return await currentUser.getIdToken(true);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}