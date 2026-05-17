import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import {
  getCachedSessionHash,
  setCachedSessionHash,
  invalidateSessionCache,
  scheduleCacheCleanup,
} from "@/lib/session-cache";

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

      // Validate sessionHash against database with caching
      if (token.id && token.sessionHash) {
        const cachedHash = getCachedSessionHash(token.id as string);
        if (cachedHash !== null && cachedHash === token.sessionHash) {
          // Cache hit — session is valid, skip DB query
        } else {
          scheduleCacheCleanup();
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { sessionHash: true },
            });
            if (!dbUser || dbUser.sessionHash !== token.sessionHash) {
              invalidateSessionCache(token.id as string);
              token.id = null;
              token.sessionHash = null;
              token.twoFactorEnabled = false;
              return token;
            }
            if (dbUser.sessionHash) {
              setCachedSessionHash(token.id as string, dbUser.sessionHash);
            }
          } catch {
            token.id = null;
            token.sessionHash = null;
            token.twoFactorEnabled = false;
            return token;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        session.user.twoFactorEnabled = !!token.twoFactorEnabled;
        session.user.sessionHash = token.sessionHash as string | null | undefined;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const { auth } = NextAuth(authConfig);
