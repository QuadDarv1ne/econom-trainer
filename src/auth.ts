import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text", optional: true },
      },
      async authorize(credentials, ctx) {
        // Rate limiting: check before any DB work
        const ip = ctx ? getClientIP((ctx as { request?: Request }).request as Request) : null;
        const limit = checkRateLimit('login', ip);
        if (!limit.ok) {
          throw new Error("RateLimitExceeded");
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { twoFactorConf: true },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        // If 2FA is enabled, verify second factor
        if (user.twoFactorEnabled && user.twoFactorConf) {
          const code = credentials.twoFactorCode as string;
          if (!code) {
            throw new Error("TwoFactorRequired");
          }

          // Verify TOTP code
          const isTOTPValid = authenticator.verify({
            token: code,
            secret: user.twoFactorConf.secret,
          });

          if (!isTOTPValid) {
            // Check backup codes
            let backupCodes: string[] = [];
            try {
              backupCodes = JSON.parse(user.twoFactorConf.backupCodes || "[]");
            } catch {
              backupCodes = [];
            }
            let backupUsed = false;

            for (let i = 0; i < backupCodes.length; i++) {
              const matches = await bcrypt.compare(code, backupCodes[i]);
              if (matches) {
                // Remove used code
                backupCodes.splice(i, 1);
                await prisma.twoFactorConfirmation.update({
                  where: { userId: user.id },
                  data: { backupCodes: JSON.stringify(backupCodes) },
                });
                backupUsed = true;
                break;
              }
            }

            if (!backupUsed) {
              return null; // Invalid code
            }
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          twoFactorEnabled: user.twoFactorEnabled,
          sessionHash: user.sessionHash,
        };
      },
    }),
  ],
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
            // Session has been revoked - invalidate by clearing sensitive fields
            return { id: null, sessionHash: null, twoFactorEnabled: null };
          }
        } catch (error) {
          // If DB check fails, log error and fail closed for security
          console.error("Session validation failed:", error);
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
  events: {
    async linkAccount({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  secret: process.env.AUTH_SECRET,
});
