import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text", optional: true },
      },
      async authorize(credentials) {
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

        // Если 2FA включена, проверяем второй фактор
        if (user.twoFactorEnabled && user.twoFactorConf) {
          const code = credentials.twoFactorCode as string;
          if (!code) {
            // Бросаем ошибку с кастомным сообщением для фронтенда
            throw new Error("TwoFactorRequired");
          }

          // Проверяем TOTP код
          const isTOTPValid = authenticator.verify({
            token: code,
            secret: user.twoFactorConf.secret,
          });

          if (!isTOTPValid) {
            // Проверяем backup коды
            const backupCodes = JSON.parse(user.twoFactorConf.backupCodes || "[]") as string[];
            let backupUsed = false;

            for (let i = 0; i < backupCodes.length; i++) {
              const matches = await bcrypt.compare(code, backupCodes[i]);
              if (matches) {
                // Удаляем использованный код
                backupCodes.splice(i, 1);
                await prisma.twoFactorConf.update({
                  where: { userId: user.id },
                  data: { backupCodes: JSON.stringify(backupCodes) },
                });
                backupUsed = true;
                break;
              }
            }

            if (!backupUsed) {
              return null; // Неверный код
            }
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          twoFactorEnabled: user.twoFactorEnabled,
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
        token.twoFactorEnabled = (user as any).twoFactorEnabled;
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
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
