/**
 * Safely extract an error message from a non-OK response.
 * Returns a fallback message if the response body is not valid JSON
 * or does not contain an error field.
 */
export async function safeErrorFromResponse(
  res: Response,
  fallback = "An unexpected error occurred"
): Promise<string> {
  try {
    const data = await res.json();
    return (data && typeof data.error === "string") ? data.error : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safely extract an error message from already-parsed JSON data.
 * Use this when you already called res.json() and need a typed error message.
 */
export function safeErrorMessage(
  data: unknown,
  fallback = "An unexpected error occurred"
): string {
  return (data && typeof data === "object" && "error" in data && typeof (data as Record<string, unknown>).error === "string")
    ? (data as Record<string, string>).error
    : fallback;
}
