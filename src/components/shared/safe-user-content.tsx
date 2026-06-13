"use client";

import { useState } from "react";

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
 * Always returns a JSX fragment for consistent rendering.
 */
export function SafeUserInitials({ name }: { name: string | null | undefined }) {
  if (!name) return <>{'?'}</>;

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
 * Blocks javascript:, data:, and vbscript: URIs, including URL-encoded variants
 * (e.g. %6Aavascript:alert(1) → blocked as javascript:).
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

    // Decode URL-encoded characters to catch obfuscated dangerous protocols
    // e.g. %6Aavascript: → javascript:, %64ata: → data:
    let decoded: string;
    try {
      decoded = decodeURIComponent(url);
    } catch {
      // Invalid URL encoding — reject
      return null;
    }

    // Block dangerous protocols (check both original and decoded)
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    const lowerOriginal = url.toLowerCase();
    const lowerDecoded = decoded.toLowerCase();
    for (const protocol of dangerousProtocols) {
      if (lowerOriginal.startsWith(protocol) || lowerDecoded.startsWith(protocol)) {
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
 * Handles image load errors by hiding the broken image.
 */
export function SafeAvatarImage({ src, alt }: { src: string | null | undefined; alt?: string }) {
  const [hasError, setHasError] = useState(false);
  const safeUrl = sanitizeUserUrl(src);

  if (!safeUrl || hasError) return null;

  return (
    <img
      src={safeUrl}
      alt={alt || 'User avatar'}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}
