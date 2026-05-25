import { cookies } from 'next/headers';

/**
 * Determine the user's locale from the `locale` cookie on the server.
 * Falls back to 'ru' when the cookie is absent or unreadable.
 */
export async function getServerLocale(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('locale')?.value;
    if (cookieLocale === 'en' || cookieLocale === 'zh') return cookieLocale;
  } catch {
    // cookies() may not be available in all contexts
  }
  return 'ru';
}
