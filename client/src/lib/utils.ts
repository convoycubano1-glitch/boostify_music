/**
 * Utilidades comunes para la aplicación
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases usando clsx y tailwind-merge
 * Útil para componentes que aceptan className como prop
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea segundos a formato mm:ss.ms o hh:mm:ss dependiendo de la duración
 * @param seconds Tiempo en segundos
 * @param showMilliseconds Si se deben mostrar los milisegundos
 */
export function formatTime(seconds: number, showMilliseconds: boolean = false): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (showMilliseconds) {
    const ms = Math.floor((seconds % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Genera un ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Trunca un texto a una longitud específica
 * @param text Texto a truncar
 * @param maxLength Longitud máxima
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * Espera un tiempo determinado
 * @param ms Milisegundos a esperar
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce una función
 * @param fn Función a debounce
 * @param ms Milisegundos de delay
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Throttle una función
 * @param fn Función a throttle
 * @param ms Milisegundos de delay
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let canRun = true;
  return function(this: any, ...args: Parameters<T>) {
    if (!canRun) return;
    canRun = false;
    fn.apply(this, args);
    setTimeout(() => {
      canRun = true;
    }, ms);
  };
}