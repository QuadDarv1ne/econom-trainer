import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { validateJwtSession } from "@/lib/validate-jwt-session";

import { REMEMBER_ME_SESSION_SECONDS, DEFAULT_SESSION_SECONDS } from '@/lib/constants';
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text", optional: true },
        rememberMe: { label: "Remember Me", type: "checkbox", optional: true },
      },
      async authorize(credentials, ctx) {
        // Rate limiting: check before any DB work
        const ctxRequest = (ctx as { request?: Request })?.request;
        const ip = ctxRequest instanceof Request ? getClientIP(ctxRequest) : null;
        const limit = checkRateLimit('login', ip);
        if (!limit.ok) {
          throw new Error("RateLimitExceeded");
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email;
        const password = credentials.password;
        const twoFactorCode = credentials.twoFactorCode;
        const rememberMe = credentials.rememberMe === 'true' || credentials.rememberMe === true;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { twoFactorConf: true },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        // If 2FA is enabled, verify second factor
        if (user.twoFactorEnabled && user.twoFactorConf) {
          if (!twoFactorCode || typeof twoFactorCode !== "string") {
            throw new Error("TwoFactorRequired");
          }

          // Verify TOTP code
          const isTOTPValid = authenticator.verify({
            token: twoFactorCode,
            secret: user.twoFactorConf.secret,
          });

          if (!isTOTPValid) {
            // Check backup codes with atomic update to prevent race condition
            let backupUsed = false;

            // Use findFirst with write lock via transaction
            const twoFactorConf = await prisma.twoFactorConfirmation.findUnique({
              where: { userId: user.id },
            });

            if (!twoFactorConf) return null;

            let backupCodes: string[] = [];
            try {
              backupCodes = JSON.parse(twoFactorConf.backupCodes || "[]");
            } catch {
              backupCodes = [];
            }

            // Find matching backup code with constant-time comparison
            // Always compare ALL codes to prevent timing oracle attacks
            let matchedIndex = -1;
            for (let i = 0; i < backupCodes.length; i++) {
              try {
                const matches = await bcrypt.compare(twoFactorCode, backupCodes[i]);
                if (matches && matchedIndex === -1) {
                  matchedIndex = i;
                  // No break — continue comparing all codes for constant-time behavior
                }
              } catch {
                // Corrupted backup code hash — skip this entry
              }
            }

            if (matchedIndex !== -1) {
              // Atomically remove used code with optimistic concurrency control
              const updatedCodes = backupCodes.filter((_, i) => i !== matchedIndex);
              const result = await prisma.twoFactorConfirmation.updateMany({
                where: { userId: user.id, backupCodes: twoFactorConf.backupCodes },
                data: { backupCodes: JSON.stringify(updatedCodes) },
              });
              if (result.count > 0) {
                backupUsed = true;
              }
            }

            if (!backupUsed) {
              return null; // Invalid code or concurrent use detected
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
          rememberMe,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === 'production',
        path: "/",
      },
    },
  },
  session: {
    strategy: "jwt",
    maxAge: REMEMBER_ME_SESSION_SECONDS,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.twoFactorEnabled = user.twoFactorEnabled;
        token.sessionHash = user.sessionHash;
        if (user.rememberMe) {
          token.rememberMe = true;
        } else {
          token.exp = Math.floor(Date.now() / 1000) + DEFAULT_SESSION_SECONDS;
        }
      }
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }

      // Extended session duration for remembered sessions (30 days vs default)
      if (token.rememberMe) {
        const thirtyDays = Math.floor(Date.now() / 1000) + REMEMBER_ME_SESSION_SECONDS;
        token.exp = Math.max(token.exp ?? 0, thirtyDays);
      }

      // Validate sessionHash against database with caching
      if (token.id && token.sessionHash) {
        return validateJwtSession(token);
      }

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
