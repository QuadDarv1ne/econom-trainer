import { auth } from '@/auth';
import { modules, tabItems, categoryBreaks } from '@/lib/module-data';
import { HomeClient } from '@/app/home-client';
import { getServerLocale as getServerLocaleRaw, type Locale } from '@/lib/server-locale';

async function getServerLocale(): Promise<Locale> {
  const locale = await getServerLocaleRaw();
  return locale as Locale;
}

export default async function HomePage() {
  const session = await auth();
  await getServerLocale();

  const visibleModules = session ? modules : modules.filter((m) => m.public);
  const visibleTabItems = session
    ? tabItems
    : tabItems.filter(
        (item) => item.value === 'home' || modules.find((m) => m.id === item.value)?.public,
      );
  const visibleCategoryBreaks = session
    ? categoryBreaks
    : new Set([...categoryBreaks].filter((id) => modules.find((m) => m.id === id)?.public));

  const totalModules = modules.length;

  // Pass only serializable session data
  const sessionData = session
    ? {
        user: {
          name: session.user?.name ?? null,
          email: session.user?.email ?? null,
          image: session.user?.image ?? null,
        },
      }
    : null;

  return (
    <HomeClient
      session={sessionData}
      visibleModules={visibleModules}
      visibleTabItems={visibleTabItems}
      visibleCategoryBreaks={visibleCategoryBreaks}
      totalModules={totalModules}
    />
  );
}
