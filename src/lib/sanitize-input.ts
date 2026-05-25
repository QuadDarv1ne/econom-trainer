/**
 * Strip HTML tags and control characters from user input.
 */
export function sanitizeInput(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}
