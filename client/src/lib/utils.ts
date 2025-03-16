import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases css con tailwind-merge
 * Esto permite combinar clases de manera inteligente, resolviendo conflictos
 * y aplicando las reglas correctamente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}