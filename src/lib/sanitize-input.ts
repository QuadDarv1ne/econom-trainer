import sanitizeHtmlLib from 'sanitize-html';

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
  
  // Allow http: and https: URLs (case-insensitive)
  const lowerTrimmed = trimmed.toLowerCase()
  if (lowerTrimmed.startsWith('http://') || lowerTrimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return '';
    }
  }
  
  return '';
}

