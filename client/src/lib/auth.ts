import { auth } from '@/firebase';

/**
 * Implements exponential backoff for retrying network requests
 * @param fn Function to retry
 * @param retries Number of retries
 * @param delay Initial delay in ms
 * @returns Promise with the result of the function
 */
async function withRetry<T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delay = 300
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Only retry network errors
    if (
      retries > 0 && 
      (error.code === 'auth/network-request-failed' || 
       error.message?.includes('network') ||
       error.name === 'NetworkError' ||
       error.name === 'AbortError' ||
       error.message?.includes('fetch'))
    ) {
      console.warn(`Auth operation failed, retrying (${retries} attempts left)...`, error);
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry with increased delay
      return withRetry(fn, retries - 1, delay * 2);
    }
    
    // For other errors, just throw
    throw error;
  }
}

/**
 * Retrieves the current Firebase authentication token with retry capability
 * @returns Promise with the token string or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('No user is signed in');
      return null;
    }
    
    // Use retry mechanism for token refresh
    return await withRetry(() => currentUser.getIdToken(true));
  } catch (error) {
    console.error('Error getting auth token after retries:', error);
    
    // Consider forcing a reauthentication if token refresh fails consistently
    if (error.code === 'auth/network-request-failed') {
      console.warn('Network issues detected. The user may need to refresh the page or check connection.');
    }
    
    return null;
  }
}