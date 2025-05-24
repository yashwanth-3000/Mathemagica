import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a UUID v4 for use as a unique identifier.
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
