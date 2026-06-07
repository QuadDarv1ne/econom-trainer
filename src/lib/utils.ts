import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(4)
    crypto.getRandomValues(arr)
    return `${arr[0].toString(36)}-${arr[1].toString(36)}-${arr[2].toString(36)}-${arr[3].toString(36)}`
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
