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
    
    try {
      // Intentar recargar la información del usuario para asegurar un token fresco
      console.log('Recargando información del usuario para obtener token fresco');
      await auth.currentUser?.reload();
    } catch (reloadError) {
      console.warn('No se pudo recargar la información del usuario:', reloadError);
      // Continuamos aunque haya error, intentando obtener el token disponible
    }
    
    // Usar el mecanismo de reintento para obtener el token
    console.log('Obteniendo token de autenticación...');
    const token = await withRetry(() => currentUser.getIdToken(true));
    console.log('Token obtenido correctamente:', token ? 'Token presente' : 'Token no disponible');
    return token;
  } catch (error: unknown) {
    console.error('Error getting auth token after retries:', error);
    
    // Verificación de tipos apropiada para errores de Firebase
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string, message?: string };
      console.warn(`Firebase auth error: ${firebaseError.code} - ${firebaseError.message || 'No message'}`);
      
      if (firebaseError.code === 'auth/network-request-failed') {
        console.warn('Network issues detected. The user may need to refresh the page or check connection.');
      } else if (firebaseError.code === 'auth/user-token-expired') {
        console.warn('User token has expired. The user may need to sign in again.');
        // Podríamos intentar cerrar sesión y redirigir a página de login automáticamente
      }
    }
    
    return null;
  }
}