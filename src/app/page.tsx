import { auth } from '@/auth';
import { t, formatNumber, type Locale } from '@/lib/i18n';
import { modules, tabItems, categoryBreaks } from '@/lib/module-data';
import { HomeClient } from '@/app/home-client';
import { getServerLocale as getServerLocaleRaw } from '@/lib/server-locale';

async function getServerLocale(): Promise<Locale> {
  const locale = await getServerLocaleRaw();
  return locale as Locale;
}

export default async function HomePage() {
  const session = await auth();
  const locale = await getServerLocale();

  const tr = (key: string) => t(key, locale);
  const fmt = (value: number) => formatNumber(value, locale);

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

  return (
    <HomeClient
      session={session}
      locale={locale}
      visibleModules={visibleModules}
      visibleTabItems={visibleTabItems}
      visibleCategoryBreaks={visibleCategoryBreaks}
      totalModules={totalModules}
      t={tr}
      fmt={fmt}
    />
  );
}
