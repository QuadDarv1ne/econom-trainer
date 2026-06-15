import { auth } from '@/auth';
import { modules } from '@/lib/module-data';
import { HomeClient } from '@/app/home-client';

export default async function HomePage() {
  const session = await auth();

  const visibleModules = session ? modules : modules.filter((m) => m.public);
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
      totalModules={totalModules}
    />
  );
}
