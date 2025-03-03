import { User } from "firebase/auth";
import { auth } from "@/firebase";

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
  } catch (error) {
    if (retries <= 0) throw error;
    console.log(`Retrying operation after ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

/**
 * Retrieves the current Firebase authentication token with retry capability
 * @returns Promise with the token string or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  
  return withRetry(async () => {
    return auth.currentUser?.getIdToken(true) || null;
  });
}