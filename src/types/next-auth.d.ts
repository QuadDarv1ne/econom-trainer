import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      twoFactorEnabled?: boolean;
      sessionHash?: string | null;
    };
  }

  interface User {
    id: string;
    twoFactorEnabled?: boolean;
    sessionHash?: string | null;
    rememberMe?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    twoFactorEnabled?: boolean;
    sessionHash?: string | null;
    rememberMe?: boolean;
    exp?: number;
  }
}
