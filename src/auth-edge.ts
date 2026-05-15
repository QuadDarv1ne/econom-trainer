import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";

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

      // Validate sessionHash against database on every request
      if (token.id && token.sessionHash) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { sessionHash: true },
          });
          if (!dbUser || dbUser.sessionHash !== token.sessionHash) {
            return { id: null, sessionHash: null, twoFactorEnabled: null };
          }
        } catch {
          return { id: null, sessionHash: null, twoFactorEnabled: null };
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.sessionHash = token.sessionHash as string | null | undefined;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const { auth } = NextAuth(authConfig);
