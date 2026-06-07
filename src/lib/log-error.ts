/**
 * Safe error logging utility.
 * Sanitizes error objects before logging to prevent sensitive data
 * (passwords, tokens, secrets) from appearing in logs.
 */

// Patterns that indicate sensitive values in error messages or stack traces
const SENSITIVE_PATTERNS = [
  /password/i,
  /(?:access[_\s-]?token|auth[_\s-]?token|reset[_\s-]?token|session[_\s-]?token|bearer[_\s-]?token|api[_\s-]?key)/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
  /credential/i,
  /hash/i,
  /api[_\s-]?key/i,
  /private[_\s-]?key/i,
  /access[_\s-]?key/i,
  /signing[_\s-]?key/i,
  /encryption[_\s-]?key/i,
];

/**
 * Check if a string contains sensitive data patterns.
 */
function containsSensitiveData(str: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(str));
}

/**
 * Sanitize an error object for safe logging.
 * Returns a safe message that doesn't leak sensitive data.
 */
function sanitizeError(error: unknown, depth = 0): string {
  // Prevent infinite recursion on circular references
  if (depth > 3) return '[redacted: deep nesting]';

  if (error instanceof Error) {
    const message = error.message;
    if (containsSensitiveData(message)) {
      return "Sensitive error occurred";
    }
    return message;
  }
  if (typeof error === "string") {
    if (containsSensitiveData(error)) {
      return "Sensitive error occurred";
    }
    return error;
  }
  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_PATTERNS.some((p) => p.test(key))) {
        return "Sensitive error occurred";
      }
      if (typeof value === "string" && containsSensitiveData(value)) {
        return "Sensitive error occurred";
      }
      if (typeof value === "object" && value !== null) {
        const nested = sanitizeError(value, depth + 1);
        if (nested === "Sensitive error occurred" || nested.startsWith("[redacted")) {
          return "Sensitive error occurred";
        }
      }
    }
    try {
      return JSON.stringify(error).slice(0, 200);
    } catch {
      return '[Object - serialization failed]';
    }
  }
  return String(error);
}

/**
 * Log an error safely without leaking sensitive data.
 * Usage: logError("Context label", error);
 */
export function logError(context: string, error: unknown): void {
  const safeMessage = sanitizeError(error);
  // Only log the context and a sanitized message
  console.error(`[${context}] ${safeMessage}`);
}
