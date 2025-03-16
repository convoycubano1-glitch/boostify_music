/**
 * Funciones auxiliares para autenticación
 */

import { getAuth } from 'firebase/auth';

/**
 * Obtiene el ID del usuario actualmente autenticado
 * @returns ID del usuario o null si no hay usuario autenticado
 */
export function getUserId(): string | null {
  const auth = getAuth();
  return auth.currentUser?.uid || null;
}

/**
 * Verifica si el usuario está autenticado
 * @returns Booleano indicando si hay un usuario autenticado
 */
export function isUserAuthenticated(): boolean {
  return !!getUserId();
}

/**
 * Obtiene el email del usuario autenticado
 * @returns Email del usuario o null si no hay usuario autenticado
 */
export function getUserEmail(): string | null {
  const auth = getAuth();
  return auth.currentUser?.email || null;
}

/**
 * Verifica si el usuario actual es un administrador
 * @param adminEmails Lista de emails de administradores
 * @returns Booleano indicando si el usuario es administrador
 */
export function isUserAdmin(adminEmails: string[] = []): boolean {
  const email = getUserEmail();
  return !!email && adminEmails.includes(email);
}