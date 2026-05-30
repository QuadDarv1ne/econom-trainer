import sanitizeHtmlLib from 'sanitize-html';

/**
 * Strip HTML tags and control characters from user input.
 * Used as a lightweight fallback when sanitize-html is unavailable.
 */
/**
 * @deprecated Use sanitizePlainText instead. This regex-based approach is vulnerable to SVG XSS.
 */
export function sanitizeInput(input: string): string {
  return sanitizePlainText(input)
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
    allowedSchemesApplyToAttributes: {
      href: ['http', 'https', 'mailto', 'tel'],
    },
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
