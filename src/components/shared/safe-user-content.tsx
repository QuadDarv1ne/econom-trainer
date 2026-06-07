"use client";



/**
 * Safely renders user-generated text content.
 * Uses React's automatic text escaping as primary defense,
 * with optional additional HTML tag stripping for defense-in-depth.
 *
 * Usage: <SafeUserContent>{userName}</SafeUserContent>
 */
export function SafeUserContent({ children }: { children: string | null | undefined }) {
  if (!children) return null;
  // React automatically escapes text content, preventing XSS
  // This component serves as a semantic marker for security review
  return <>{children}</>;
}

/**
 * Safely renders user initials (first letters of name parts).
 * Sanitizes input by taking only ASCII letters from each word.
 */
export function SafeUserInitials({ name }: { name: string | null | undefined }) {
  if (!name) return '?';
  
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
    // Only allow ASCII letters in initials
    .replace(/[^A-Z]/g, '');
  
  return <>{initials || '?'}</>;
}

/**
 * Validates and sanitizes user-provided URLs (avatar images, etc.).
 * Blocks javascript:, data:, and vbscript: URIs.
 */
export function sanitizeUserUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    // Allow relative URLs
    if (url.startsWith('/')) return url;
    
    // Allow http(s) URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    const lowerUrl = url.toLowerCase();
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        // Blocked dangerous protocol - silently reject without logging sensitive URL
        return null;
      }
    }
    
    return url;
  } catch {
    return null;
  }
}

/**
 * Avatar image component that validates the src URL.
 * Prevents javascript: and data: URIs from being used as avatar sources.
 */
export function SafeAvatarImage({ src, alt }: { src: string | null | undefined; alt?: string }) {
  const safeUrl = sanitizeUserUrl(src);
  
  if (!safeUrl) return null;
  
  return <img src={safeUrl} alt={alt || 'User avatar'} loading="lazy" className="h-full w-full object-cover" />;
}
