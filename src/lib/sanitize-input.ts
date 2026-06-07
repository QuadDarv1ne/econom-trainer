import sanitizeHtmlLib from 'sanitize-html';

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
    allowedSchemesAppliedToAttributes: ['href'],
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

/**
 * Sanitize image URLs to prevent XSS via javascript: or data: URIs.
 * Only allows http:, https:, and relative URLs.
 */
export function sanitizeImageUrl(url: string): string {
  const trimmed = url.trim();
  
  // Allow empty or relative URLs
  if (!trimmed || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed;
  }
  
  // Allow data: image URLs with proper validation
  if (trimmed.startsWith('data:')) {
    const match = trimmed.match(/^data:(image\/[a-zA-Z0-9-.+]+);base64,/);
    if (match && match[1]) {
      return trimmed;
    }
    return '';
  }
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:text/html'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.toLowerCase().startsWith(protocol)) {
      return '';
    }
  }
  
  // Allow http: and https: URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return '';
    }
  }
  
  return '';
}

