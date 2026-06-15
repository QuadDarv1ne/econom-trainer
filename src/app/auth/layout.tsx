import type React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-background dark:to-blue-950/30" />
        <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-3xl animate-glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] right-[20%] h-[300px] w-[300px] rounded-full bg-amber-500/5 dark:bg-amber-500/10 blur-3xl animate-glow-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="fixed inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {children}
    </div>
  );
}
