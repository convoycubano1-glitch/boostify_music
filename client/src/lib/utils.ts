import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with tailwind-merge for optimized classes
 * Use this when dynamically applying class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats time in seconds to a readable format: HH:MM:SS or MM:SS
 * @param seconds Time in seconds
 * @param includeHours Whether to include hours in the output
 * @param showMilliseconds Whether to include milliseconds in the output
 */
export function formatTime(
  seconds: number,
  includeHours = false,
  showMilliseconds = false
): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return includeHours ? "00:00:00" : "00:00";
  }

  // Handle negative values
  const isNegative = seconds < 0;
  seconds = Math.abs(seconds);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  let result = "";
  
  if (includeHours || hours > 0) {
    result = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  } else {
    result = `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  if (showMilliseconds) {
    result += `.${ms.toString().padStart(3, "0")}`;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Converts a time string (HH:MM:SS, MM:SS, or SS) to seconds
 * @param timeString Time in string format
 */
export function timeStringToSeconds(timeString: string): number {
  if (!timeString) return 0;

  // Split by : to get parts
  const parts = timeString.trim().split(":");
  
  if (parts.length === 3) {
    // HH:MM:SS format
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    // MM:SS format
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    
    return minutes * 60 + seconds;
  } else if (parts.length === 1) {
    // SS format
    return parseFloat(parts[0]);
  }
  
  return 0;
}

/**
 * Generates a random string of specified length
 * @param length Length of the string to generate
 */
export function generateRandomString(length: number = 8): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Safely retrieves a nested property from an object
 * @param obj The object to retrieve from
 * @param path The path to the property (e.g. 'a.b.c')
 * @param defaultValue Default value if property is not found
 */
export function getNestedValue(obj: any, path: string, defaultValue: any = undefined): any {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null || !Object.prototype.hasOwnProperty.call(current, key)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current === undefined ? defaultValue : current;
}

/**
 * Formats a file size in bytes to a human-readable format
 * @param bytes File size in bytes
 * @param decimals Number of decimal places
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Debounces a function
 * @param func The function to debounce
 * @param wait The time to wait before executing in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Validates the extension of a file against a list of allowed extensions
 * @param filename The filename to validate
 * @param allowedExtensions List of allowed extensions
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  if (!filename) return false;
  
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  
  return allowedExtensions.includes(ext);
}

/**
 * Creates a timestamp-based filename with the given extension
 * @param prefix Prefix for the filename
 * @param extension File extension without dot
 */
export function createTimestampFilename(prefix: string = 'file', extension: string = 'txt'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Checks if a point is inside a rectangle
 * @param x X coordinate of the point
 * @param y Y coordinate of the point
 * @param rect Rectangle with x, y, width, height
 */
export function isPointInRect(
  x: number,
  y: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

/**
 * Truncates a string to a specific length and adds ellipsis if needed
 * @param str The string to truncate
 * @param maxLength Maximum length of the string
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Converts a hex color to an RGBA string
 * @param hex Hex color (e.g. #FF0000 or #F00)
 * @param alpha Alpha value (0-1)
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  if (!hex) return 'rgba(0, 0, 0, 1)';
  
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert short hex to full form
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Creates a nice color palette with the given number of colors
 * @param count Number of colors to generate
 */
export function generateColorPalette(count: number): string[] {
  const hueStep = 360 / count;
  const colors: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const hue = i * hueStep;
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  
  return colors;
}

/**
 * Clamps a number between min and max values
 * @param num Number to clamp
 * @param min Minimum value
 * @param max Maximum value
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Returns a random integer between min and max (inclusive)
 * @param min Minimum value
 * @param max Maximum value
 */
export function randomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a shallow copy of an object without specified keys
 * @param obj Object to copy
 * @param keys Keys to exclude
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}

/**
 * Returns a shallow copy of an object with only specified keys
 * @param obj Object to copy
 * @param keys Keys to include
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Returns a promise that resolves after specified milliseconds
 * @param ms Milliseconds to wait
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Returns a comparison function for sorting arrays of objects by a key
 * @param key Key to sort by
 * @param direction Sort direction ('asc' or 'desc')
 */
export function sortByKey<T>(
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): (a: T, b: T) => number {
  return (a: T, b: T) => {
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  };
}

/**
 * Groups an array of objects by a key
 * @param array Array to group
 * @param key Key to group by
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const keyValue = String(item[key]);
    return {
      ...result,
      [keyValue]: [...(result[keyValue] || []), item],
    };
  }, {} as Record<string, T[]>);
}

/**
 * Capitalizes the first letter of each word in a string
 * @param str String to capitalize
 */
export function capitalizeWords(str: string): string {
  if (!str) return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Formats a date to a locale string
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions
 * @param locale Locale string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  },
  locale: string = 'es-ES'
): string {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  return dateObj.toLocaleDateString(locale, options);
}

/**
 * Checks if value is an object that is not null, undefined, or an array
 * @param value Value to check
 */
export function isObject(value: any): boolean {
  return value !== null && 
         typeof value === 'object' && 
         !Array.isArray(value);
}

/**
 * Deep merges two objects
 * @param target Target object
 * @param source Source object
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key as keyof T])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key as keyof T] });
        } else {
          output[key as keyof T] = deepMerge(
            target[key as keyof T],
            source[key as keyof T] as any
          );
        }
      } else {
        Object.assign(output, { [key]: source[key as keyof T] });
      }
    });
  }

  return output;
}