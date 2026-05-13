import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.twoFactorEnabled = (user as any).twoFactorEnabled;
        token.sessionHash = (user as any).sessionHash;
      }
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        (session.user as any).sessionHash = token.sessionHash;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const { auth } = NextAuth(authConfig);
