import sanitizeHtmlLib from 'sanitize-html';

/**
 * Strip HTML tags and control characters from user input.
 * Used as a lightweight fallback when sanitize-html is unavailable.
 */
export function sanitizeInput(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Sanitize user-provided HTML strings using sanitize-html.
 * Allows only a safe subset of formatting tags.
 */
export function sanitizeHtml(value: string): string {
  return sanitizeHtmlLib(value, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a'],
    allowedAttributes: {
      a: ['href', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
  }).trim();
}

/**
 * Strictly sanitize plain-text fields (name, phone, etc.).
 * Removes all HTML tags — stronger than the legacy sanitizeInput.
 */
export function sanitizePlainText(value: string): string {
  return sanitizeHtmlLib(value, {
    allowedTags: [],
    disallowedTagsMode: 'discard',
  }).trim();
}
