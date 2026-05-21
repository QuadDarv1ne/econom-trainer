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
