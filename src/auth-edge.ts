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
        token.twoFactorEnabled = user.twoFactorEnabled;
        token.sessionHash = user.sessionHash;
      }
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      // Note: Full sessionHash validation against DB happens in auth.ts (server-side).
      // Edge middleware only checks token presence for routing — no DB access here.
      return token;
    },
    async session({ session, token }) {
      if (typeof token.id === "string") {
        session.user.id = token.id;
        session.user.twoFactorEnabled = !!token.twoFactorEnabled;
        session.user.sessionHash =
          typeof token.sessionHash === "string" ? token.sessionHash : null;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const { auth } = NextAuth(authConfig);
